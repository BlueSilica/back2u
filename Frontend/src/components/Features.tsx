const Features = () => {
  const features = [
    {
      icon: '🔍',
      title: 'Smart Search',
      description: 'Advanced search filters to help you find lost items quickly by category, location, date, and description.'
    },
    {
      icon: '📍',
      title: 'Location Tracking',
      description: 'Mark where you lost or found items with precise location details to improve reunion chances.'
    },
    {
      icon: '🔔',
      title: 'Instant Notifications',
      description: 'Get notified immediately when someone reports finding an item matching your lost item description.'
    },
    {
      icon: '🛡️',
      title: 'Secure Platform',
      description: 'Your privacy is protected. Contact information is only shared when there\'s a verified match.'
    },
    {
      icon: '🤝',
      title: 'Community Driven',
      description: 'Join a community of helpful people working together to reunite lost items with their owners.'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Report and search for items on the go with our fully responsive mobile-optimized platform.'
    }
  ]

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Back2U?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Our platform makes it easy to report and find lost items with powerful features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 p-8 rounded-2xl text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary-500 border border-gray-200 group relative overflow-hidden"
            >
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 transform translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="text-5xl mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent filter drop-shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
