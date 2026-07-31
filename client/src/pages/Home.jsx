import SearchForm from "../components/SearchForm";

function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-sky-100 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full">

          <div className="max-w-3xl">

            <h1 className="text-6xl font-extrabold text-blue-700 leading-tight">
              Fly Smarter.
              <br />
              Travel Safer.
            </h1><p className="mt-4 text-gray-500 text-lg">
    Compare airlines, choose the best fares,
    and book your journey in just a few clicks.
</p>

            <p className="mt-6 text-2xl text-gray-700 leading-relaxed">
              Book domestic & international flights
              <br />
              at the best prices.
            </p>

            <a
        href="#search"
    className="
        inline-block
        mt-10
        bg-blue-700
        text-white
        px-8
        py-4
        rounded-lg
        text-lg
        font-semibold
        hover:bg-blue-800
        transition
        "
>
  Search Flights
</a>

          </div>

          <div className="absolute right-24 top-72 text-8xl opacity-20 rotate-12">
            ✈️
          </div>

        </div>
      </section>

      {/* Search Form */}
      <SearchForm />
    </>
  );
}

export default Home;