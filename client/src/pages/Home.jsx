import Navbar from "../components/Navbar";
import SearchForm from "../components/SearchForm";

function Home() {
  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-sky-100 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full relative">

          {/* Left Content */}
          <div className="max-w-3xl">

            <h1 className="text-6xl font-extrabold text-blue-700 leading-tight">
              Fly Smarter.
              <br />
              Travel Safer.
            </h1>

            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Compare airlines, choose the best fares, and book domestic &
              international flights in just a few clicks.
            </p>

            <p className="mt-6 text-2xl text-gray-700">
              Fast • Secure • Affordable
            </p>

            <a
              href="#search"
              className="inline-block mt-10 bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-800 transition"
            >
              Search Flights
            </a>

          </div>

          {/* Airplane Icon */}
          <div className="absolute right-20 top-32 text-[180px] opacity-20 rotate-12 select-none">
            ✈️
          </div>

        </div>
      </section>

      {/* Search Flights Section */}
      <SearchForm />
    </>
  );
}

export default Home;