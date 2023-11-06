import OrderBook from "@components/orderbook";

export default function Home() {
  // fetch from user account in future
  const token = process.env.PUBLIC_JWT;
  return (
    <main>
      {token ? <OrderBook token={token} /> : "Error: token undefined"}
    </main>
  );
}
