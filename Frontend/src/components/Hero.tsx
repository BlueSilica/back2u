const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 min-h-[80vh] flex items-center">
      <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 leading-tight">
            Lost Something? Found Something?
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Back2U connects people with their lost belongings. 
            Report lost items or help return found items to their rightful owners.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="btn btn-primary">Report Lost Item</button>
            <button className="btn btn-secondary">Report Found Item</button>
          </div>
        </div>
        
        <div className="flex justify-center items-center">
          <div className="relative w-80 h-80 flex justify-center items-center">
            <div className="absolute top-[10%] left-[20%] text-5xl bg-white p-4 rounded-full shadow-xl animate-float">
              📱
            </div>
            <div className="absolute top-[20%] right-[10%] text-5xl bg-white p-4 rounded-full shadow-xl animate-float" style={{animationDelay: '0.5s'}}>
              🎒
            </div>
            <div className="absolute bottom-[20%] left-[10%] text-5xl bg-white p-4 rounded-full shadow-xl animate-float" style={{animationDelay: '1s'}}>
              🔑
            </div>
            <div className="absolute bottom-[10%] right-[20%] text-5xl bg-white p-4 rounded-full shadow-xl animate-float" style={{animationDelay: '1.5s'}}>
              👓
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
