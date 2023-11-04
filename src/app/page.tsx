import OrderBook from "@components/orderbook";

export default function Home() {
  // fetch from user account in future
  const token = process.env.PUBLIC_JWT;
  return (
    <main>
      <OrderBook token={token} />
    </main>
  );
}
