export async function POST(req) {
  const res = await req.json();
  const hsCodes = res.map((item) => item["hs_code"]);
  const uniqueHsCodes = [...new Set(hsCodes)];

  console.log(uniqueHsCodes);

  return new Response("selamat");
}