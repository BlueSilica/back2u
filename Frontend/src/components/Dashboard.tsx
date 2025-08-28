import { useState, useEffect } from 'react'
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
  createdAt: string | number[]  // Handle both formats
  passwordHash?: string  // This shouldn't be in response but handle if present
}

interface MyItem {
  itemId: string
  itemName: string
  itemDescription: string
  category: string
  status: string
  reportDate: string
  lostDate: string
  itemImages?: string[]
  lostLocation: {
    address: string
    city: string
    state: string
  }
  reporterEmail: string
  lastUpdated: string
}

// MyItemsSection Component
const MyItemsSection = ({ user }: { user: { email?: string; name?: string } | null }) => {
  const [myItems, setMyItems] = useState<MyItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return
      
      setLoading(true)
      
      try {
        // Fetch user's items
        const itemsResponse = await fetch(`http://localhost:8080/lostitems?reporterEmail=${encodeURIComponent(user.email)}`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setMyItems(itemsData.items || [])
        }
      } catch (error) {
        console.error('Error fetching my items:', error)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [user?.email])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(parseInt(dateString))
      return date.toLocaleDateString()
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading your items...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {myItems.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Items Reported Yet</h3>
          <p className="text-gray-600 mb-6">Start by reporting a lost or found item</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myItems.map((item) => (
            <div key={item.itemId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.itemName}</h3>
                  <p className="text-sm text-gray-500">Reported on {formatDate(item.reportDate)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'lost' ? 'bg-red-100 text-red-800' :
                  item.status === 'found' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-600 mb-3">{item.itemDescription}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Category:</strong> {item.category}
                </div>
                <div>
                  <strong>Location:</strong> {item.lostLocation.address}
                </div>
                <div>
                  <strong>Date Lost:</strong> {formatDate(item.lostDate)}
                </div>
                <div>
                  <strong>Last Updated:</strong> {formatDate(item.lastUpdated)}
                </div>
              </div>

              {item.itemImages && item.itemImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Attached Images:</p>
                  <div className="flex space-x-2">
                    {item.itemImages.map((imageUrl, index) => (
                      <a
                        key={index}
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200"
                      >
                        📷 Image {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'feed' | 'my-items' | 'reports' | 'users'>('feed')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost')
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Form states for report modal
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: '',
    contactInfo: '',
    reward: '',
    additionalNotes: ''
  })

  // Function to fetch all registered users
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

  // Fetch users when Users tab is selected
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  // File upload functions
  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        // Check file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf']
        if (!validTypes.includes(file.type)) {
          alert(`File type ${file.type} is not supported. Please use PNG, JPG, GIF, WebP, or PDF.`)
          return false
        }
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`)
          return false
        }
        return true
      })
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    setUploadingFiles(true)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('uploadedBy', user?.email || 'anonymous')
        formData.append('category', reportType === 'lost' ? 'lost-item' : 'found-item')

        const response = await fetch('http://localhost:8080/files', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          uploadedUrls.push(result.fileUrl)
        } else {
          console.error('Failed to upload file:', file.name)
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploadingFiles(false)
    }

    return uploadedUrls
  }

  // Handle form submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setUploadingFiles(true)
      
      // Upload files first
      const fileUrls = selectedFiles.length > 0 ? await uploadFiles(selectedFiles) : []
      
      // Create the report request
      const reportData = {
        reporterEmail: user?.email || '',
        reporterName: user?.name || '',
        reporterPhone: user?.phoneNumber || '',
        itemName: reportForm.title,
        itemDescription: reportForm.description,
        category: reportForm.category,
        itemImages: fileUrls,
        lostDate: reportForm.date,
        lostLocation: {
          address: reportForm.location,
          city: reportForm.location.split(',')[1]?.trim() || '',
          state: reportForm.location.split(',')[2]?.trim() || '',
          country: 'USA',
          latitude: 0.0, // TODO: Add location picker
          longitude: 0.0,
          locationDescription: reportForm.additionalNotes
        },
        additionalNotes: reportForm.additionalNotes,
        contactPrefs: {
          allowEmail: true,
          allowPhone: true,
          allowChat: true,
          preferredContactTime: 'anytime'
        }
      }

      // Submit the report
      const response = await fetch('http://localhost:8080/lostitems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        // Reset form and close modal
        setReportForm({
          title: '',
          description: '',
          category: '',
          location: '',
          date: '',
          contactInfo: '',
          reward: '',
          additionalNotes: ''
        })
        setSelectedFiles([])
        setShowReportModal(false)
        alert('Report submitted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to submit report: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Error submitting report. Please try again.')
    } finally {
      setUploadingFiles(false)
    }
  }

  // Dummy data for the feed
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
    {
      id: '3',
      title: 'Found: Blue Backpack',
      description: 'Found a blue backpack with textbooks near the university library.',
      category: 'Bags',
      location: 'University Library',
      date: '2025-08-18',
      status: 'found',
      contactInfo: 'Contact to claim',
      userId: '1',
      userAvatar: '👨‍💼',
      userName: 'John Doe',
      timeAgo: '1 day ago'
    },
    {
      id: '4',
      title: 'Car Keys with BMW Keychain',
      description: 'Set of car keys with BMW keychain and house keys attached.',
      category: 'Keys',
      location: 'Mall Parking Lot',
      date: '2025-08-18',
      status: 'lost',
      contactInfo: 'Reward offered',
      reward: 50,
      userId: '2',
      userAvatar: '👩‍💼',
      userName: 'Sarah Smith',
      timeAgo: '1 day ago'
    }
  ]

  const myItems = feedItems.filter(item => item.userId === user?.id)

  const categories = ['Electronics', 'Personal Items', 'Bags', 'Keys', 'Jewelry', 'Clothing', 'Documents', 'Other']

  // Helper function to format date from API response
  const formatDate = (dateValue: string | number[]) => {
    if (Array.isArray(dateValue)) {
      // Handle Ballerina timestamp format [seconds, nanoseconds]
      const timestamp = dateValue[0] * 1000; // Convert to milliseconds
      return new Date(timestamp);
    } else {
      // Handle regular date string
      return new Date(dateValue);
    }
  }

  const ReportModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Report {reportType === 'lost' ? 'Lost' : 'Found'} Item
          </h2>
          <button 
            onClick={() => setShowReportModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setReportType('lost')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              reportType === 'lost' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📢 Report Lost Item
          </button>
          <button
            onClick={() => setReportType('found')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              reportType === 'found' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✅ Report Found Item
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmitReport}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Title *
            </label>
            <input
              type="text"
              value={reportForm.title}
              onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., iPhone 13, Brown Wallet, Blue Backpack"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select 
              value={reportForm.category}
              onChange={(e) => setReportForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              rows={4}
              value={reportForm.description}
              onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={`Describe the item in detail. Include color, brand, distinctive features, etc.`}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={reportForm.location}
                onChange={(e) => setReportForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Where was it lost/found?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={reportForm.date}
                onChange={(e) => setReportForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          {reportType === 'lost' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward (Optional)
              </label>
              <input
                type="number"
                value={reportForm.reward}
                onChange={(e) => setReportForm(prev => ({ ...prev, reward: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter reward amount if any"
                min="0"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              rows={2}
              value={reportForm.additionalNotes}
              onChange={(e) => setReportForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Any additional information that might help..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Optional)
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-4">📷</div>
              <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB each</p>
              <input 
                type="file" 
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden" 
                accept="image/*,.pdf"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="inline-block mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors"
              >
                Choose Files
              </label>
            </div>
            
            {/* Display selected files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-600 truncate">{file.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setShowReportModal(false)
                setSelectedFiles([])
                setReportForm({
                  title: '',
                  description: '',
                  category: '',
                  location: '',
                  date: '',
                  contactInfo: '',
                  reward: '',
                  additionalNotes: ''
                })
              }}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingFiles}
              className={`flex-1 px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                uploadingFiles
                  ? 'bg-gray-400 cursor-not-allowed'
                  : reportType === 'lost' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {uploadingFiles ? 'Uploading...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
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

          {/* Stats Cards */}
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

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'feed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            🌟 Community Feed
          </button>
          <button
            onClick={() => setActiveTab('my-items')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'my-items' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            📋 My Items ({myItems.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            👥 Users ({registeredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'reports' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {/* Tab Content */}
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
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'lost' 
                        ? 'bg-red-100 text-red-600' 
                        : item.status === 'found'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
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
                    <button className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors">
                      💬 Contact Owner
                    </button>
                    <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                      📤 Share
                    </button>
                    <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                      🔖 Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my-items' && (
          <MyItemsSection user={user} />
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Registered Users</h2>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {loadingUsers ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
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
                                {registeredUser.firstName && registeredUser.lastName 
                                  ? `${registeredUser.firstName[0]}${registeredUser.lastName[0]}`.toUpperCase()
                                  : registeredUser.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {registeredUser.firstName && registeredUser.lastName 
                                    ? `${registeredUser.firstName} ${registeredUser.lastName}`.trim()
                                    : registeredUser.firstName || 'Anonymous User'}
                                </div>
                                <div className="text-sm text-gray-600">{registeredUser.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-800">{registeredUser.phoneNumber}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-800">
                              {registeredUser.address.city}, {registeredUser.address.country}
                            </div>
                            <div className="text-sm text-gray-600">
                              {registeredUser.address.address}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-800">
                              {formatDate(registeredUser.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(registeredUser.createdAt).toLocaleTimeString()}
                            </div>
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
