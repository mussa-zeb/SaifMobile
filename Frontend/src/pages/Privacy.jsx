export default function Privacy() {
  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title text-3xl">Privacy Policy</h1>
      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-text-primary">What we collect</h2>
          <p className="mt-2 leading-relaxed">When you purchase from us, we record your name, phone number, CNIC (for device sales) and address. This information is used strictly for order fulfillment and warranty records.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary">How we use it</h2>
          <p className="mt-2 leading-relaxed">Your information is never sold or shared with third parties. It is stored securely and only accessible to store staff.</p>
        </section>
      </div>
    </div>
  )
}