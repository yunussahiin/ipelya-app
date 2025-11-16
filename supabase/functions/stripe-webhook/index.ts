// Bu dosya stripe-webhook edge function kodu için boş şablondur.
export const handler = async (req: Request) => {
  // TODO: burada edge function iş mantığını uygula.
  return new Response(JSON.stringify({ message: "stripe-webhook todo" }), { status: 200 });
};
