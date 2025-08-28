import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

interface LostItem {
  id: string
  title: string
  description: string
  category: string
  location: string
  date: string
  image?: string
  status: 'lost' | 'found' | 'resolved'
  contactInfo: string
  reward?: number
  userId: string
  userAvatar: string
  userName: string
  timeAgo: string
}

interface RegisteredUser {
  _id?: string
  email: string
  phoneNumber: string
  address: {
    number: string
    address: string
    postalCode: string
    city: string
    country: string
  }
  firstName?: string
  lastName?: string
  picURL?: string
  createdAt: string | number[]
  passwordHash?: string
}

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'feed' | 'my-items' | 'reports' | 'users'>('feed')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost')
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch registered users when Users tab is active
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('http://localhost:8080/users')
      if (response.ok) {
        const data = await response.json()
        setRegisteredUsers(data.users || [])
      } else {
        console.error('Failed to fetch users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
  }, [activeTab])

  // Sample static feed items
  const feedItems: LostItem[] = [
    {
      id: '1',
      title: 'iPhone 13 Pro',
      description: 'Black iPhone 13 Pro with blue case. Lost near Central Park subway station.',
      category: 'Electronics',
      location: 'Central Park, NYC',
      date: '2025-08-19',
      status: 'lost',
      contactInfo: 'Please contact if found',
      reward: 100,
      userId: '2',
      userAvatar: '👩‍💼',
      userName: 'Sarah Smith',
      timeAgo: '2 hours ago'
    },
    {
      id: '2',
      title: 'Brown Leather Wallet',
      description: 'Brown leather wallet with cards and cash. Contains important IDs.',
      category: 'Personal Items',
      location: 'Coffee Bean Cafe, Downtown',
      date: '2025-08-19',
      status: 'lost',
      contactInfo: 'Urgent - contains important documents',
      userId: '3',
      userAvatar: '👨‍🎓',
      userName: 'Mike Johnson',
      timeAgo: '4 hours ago'
    },
  ]
  const myItems = feedItems.filter(item => item.userId === user?.id)
  const categories = ['Electronics', 'Personal Items', 'Bags', 'Keys', 'Jewelry', 'Clothing', 'Documents', 'Other']

  const formatDate = (dateValue: string | number[]) => {
    if (Array.isArray(dateValue)) {
      const timestamp = dateValue[0] * 1000
      return new Date(timestamp)
    } else {
      return new Date(dateValue)
    }
  }

  // Modal for reporting lost/found items. 'found' submission implemented.
  const ReportModal = () => {
    const [itemName, setItemName] = useState('')
    const [category, setCategory] = useState(categories[0])
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [foundDate, setFoundDate] = useState('')
    const [additionalNotes, setAdditionalNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)

    const handleFileSelect = (file: File) => {
      if (file && file.type.startsWith('image/')) {
        if (file.size <= 10 * 1024 * 1024) { // 10MB limit
          setSelectedFile(file)
        } else {
          alert('File size must be less than 10MB')
        }
      } else {
        alert('Please select an image file (PNG, JPG, etc.)')
      }
    }

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    }

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
    }

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    }

    const handleFileAreaClick = () => {
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      fileInput?.click()
    }

    const handleSubmit = async (event: FormEvent) => {
      event.preventDefault()

      if (!user) {
        alert('You must be logged in to report an item.')
        return
      }

      if (reportType === 'lost') {
        alert("'Report Lost Item' functionality is not yet implemented.")
        return
      }

      setIsSubmitting(true)

      try {
        let imageUrl = ''
        
        // Upload image if selected
        if (selectedFile) {
          const formData = new FormData()
          formData.append('file', selectedFile)
          formData.append('category', 'found-item-images')
          formData.append('uploadedBy', user.email)

          try {
            const uploadResponse = await fetch('http://localhost:8080/files', {
              method: 'POST',
              body: formData,
            })

            const uploadResult = await uploadResponse.json()
            if (uploadResponse.ok && uploadResult.status === 'success') {
              imageUrl = uploadResult.fileUrl
            } else {
              console.warn('Image upload failed:', uploadResult.message)
              // Continue with submission even if image upload fails
            }
          } catch (uploadError) {
            console.warn('Image upload error:', uploadError)
            // Continue with submission even if image upload fails
          }
        }

        const payload = {
          finderEmail: user.email,
          finderName: user.name || 'Anonymous',
          finderPhone: user.phoneNumber || '',
          itemName,
          itemDescription: description,
          category,
          foundDate: foundDate, // Send as YYYY-MM-DD format
          foundLocation: {
            address: location,
            city: '',
            state: '',
            country: '',
            latitude: 0.0,
            longitude: 0.0,
          },
          additionalNotes,
          itemImages: imageUrl ? [imageUrl] : [], // Convert to array format
        }

        const response = await fetch('http://localhost:8080/founditems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await response.json()
        if (response.ok && result.status === 'success') {
          alert('Thank you! Your found item report has been submitted.')
          setShowReportModal(false)
          // Reset form
          setItemName('')
          setDescription('')
          setLocation('')
          setFoundDate('')
          setAdditionalNotes('')
          setSelectedFile(null)
        } else {
          alert(`Error: ${result.message || 'Failed to submit report.'}`)
        }
      } catch (error) {
        console.error('Submission error:', error)
        alert('An error occurred while submitting the report. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Report {reportType === 'lost' ? 'Lost' : 'Found'} Item</h2>
            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          </div>

          <div className="flex gap-4 mb-6">
            <button onClick={() => setReportType('lost')} className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${reportType === 'lost' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              📢 Report Lost Item
            </button>
            <button onClick={() => setReportType('found')} className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${reportType === 'found' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              ✅ Report Found Item
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Title *</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., iPhone 13, Brown Wallet, Blue Backpack" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Describe the item in detail. Include color, brand, distinctive features, etc." value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Where was it found?" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={foundDate} onChange={(e) => setFoundDate(e.target.value)} required />
              </div>
            </div>

            {reportType === 'found' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Any other details?" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
              </div>
            )}

            {reportType === 'lost' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reward (Optional)</label>
                  <input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter reward amount if any" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
                  <textarea rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="How should people contact you? (Your email will be shared automatically)" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image (Optional)</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragOver 
                    ? 'border-primary-500 bg-primary-50' 
                    : selectedFile 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-primary-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileAreaClick}
              >
                <div className="text-4xl mb-4">
                  {selectedFile ? '✅' : '📷'}
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-green-600 mb-2 font-medium">File selected: {selectedFile.name}</p>
                    <p className="text-sm text-gray-500">Click to change or drag a new file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input 
                  id="file-input"
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className={`flex-1 px-6 py-3 rounded-lg text-white font-medium transition-colors ${reportType === 'lost' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} disabled:opacity-50`}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 mt-1">Manage your lost and found reports</p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              📢 Report New Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{user?.itemsReported || 0}</div>
                  <div className="text-sm text-blue-500">Items Reported</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">✅</div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{user?.itemsReturned || 0}</div>
                  <div className="text-sm text-green-500">Items Returned</div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">⭐</div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{user?.reputation || 0}</div>
                  <div className="text-sm text-purple-500">Reputation Score</div>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📅</div>
                <div>
                  <div className="text-sm font-semibold text-orange-600">Member Since</div>
                  <div className="text-sm text-orange-500">{user?.joinedDate || 'Jan 2025'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${activeTab === 'feed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
          >
            🌟 Community Feed
          </button>
          <button
            onClick={() => setActiveTab('my-items')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${activeTab === 'my-items' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
          >
            📋 My Items ({myItems.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
          >
            👥 Users ({registeredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${activeTab === 'reports' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
          >
            📊 Analytics
          </button>
        </div>

        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Latest Reports</h2>
              <div className="flex gap-4">
                <select className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">All Status</option>
                  <option value="lost">Lost Items</option>
                  <option value="found">Found Items</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6">
              {feedItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{item.userAvatar}</div>
                      <div>
                        <div className="font-medium text-gray-800">{item.userName}</div>
                        <div className="text-sm text-gray-500">{item.timeAgo}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${item.status === 'lost' ? 'bg-red-100 text-red-600' : item.status === 'found' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item.status === 'lost' ? '📢 Lost' : item.status === 'found' ? '✅ Found' : '🎉 Resolved'}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <span>🏷️</span> {item.category}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span> {item.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span> {new Date(item.date).toLocaleDateString()}
                    </div>
                    {item.reward && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <span>💰</span> ${item.reward} reward
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors">💬 Contact Owner</button>
                    <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">📤 Share</button>
                    <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">🔖 Save</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my-items' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Items Reported Yet</h3>
              <p className="text-gray-600 mb-6">Start by reporting a lost or found item</p>
              <button onClick={() => setShowReportModal(true)} className="btn btn-primary">Report Your First Item</button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Registered Users</h2>
              <button onClick={fetchUsers} disabled={loadingUsers} className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50">{loadingUsers ? '🔄 Loading...' : '🔄 Refresh'}</button>
            </div>

            {loadingUsers ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : registeredUsers.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Users Found</h3>
                <p className="text-gray-600">No registered users available at the moment.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800">Contact</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800">Location</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {registeredUsers.map((registeredUser) => (
                        <tr key={registeredUser._id || registeredUser.email} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                                {registeredUser.firstName && registeredUser.lastName ? `${registeredUser.firstName[0]}${registeredUser.lastName[0]}`.toUpperCase() : registeredUser.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{registeredUser.firstName && registeredUser.lastName ? `${registeredUser.firstName} ${registeredUser.lastName}`.trim() : registeredUser.firstName || 'Anonymous User'}</div>
                                <div className="text-sm text-gray-600">{registeredUser.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-800">{registeredUser.phoneNumber}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-800">{registeredUser.address.city}, {registeredUser.address.country}</div>
                            <div className="text-sm text-gray-600">{registeredUser.address.address}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-800">{formatDate(registeredUser.createdAt).toLocaleDateString()}</div>
                            <div className="text-sm text-gray-600">{formatDate(registeredUser.createdAt).toLocaleTimeString()}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Analytics</h2>
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-600">Detailed reports and analytics will be available here</p>
            </div>
          </div>
        )}

      </div>

      {showReportModal && <ReportModal />}
    </div>
  )
}

export default Dashboard