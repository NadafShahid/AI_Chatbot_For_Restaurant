export default function Categories() {
  const categories = [
    { name: "Pizza ", img: "/images/pizza.jpg" },
    { name: "Burger", img: "/images/burger.jpg" },
    { name: "Biryani", img: "/images/biryani.jpg" },
    { name: "Chinese", img: "/images/Chinese.jpeg" },
    { name: "Ice Cream", img: "/images/Ice Cream.jpg" },
    { name: "North Indian", img: "/images/North Indian.webp" },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <h2 className="text-4xl font-bold text-center mb-10">
        What's on your mind?
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 max-w-6xl mx-auto px-4">
        {categories.map((item, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-2xl p-4 text-center hover:scale-105 transition cursor-pointer"
          >
            <img
              src={item.img}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-full mx-auto shadow-md"
            />
            <p className="mt-3 font-semibold text-gray-700">{item.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
