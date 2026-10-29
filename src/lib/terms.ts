// The terms and conditions shown at /terms and agreed to at checkout, in English (the
// version that applies), whatever language the rest of the site is in. Paragraphs can
// carry **bold** and [links](/path) to our own pages (see components/RichText).

export const CONTACT_EMAIL = "hello@envelette.com";

export const TERMS = {
  metaTitle: "Terms and conditions · Envelette",
  metaDescription: "The terms for buying and sending Envelette cards: who we are, what you get, cancelling and refunds, and your rights.",
  title: "Terms and conditions",
  intro: "In plain English: what you get when you buy a card from us, what we ask of you, and what happens if something goes wrong.",
  updated: "Last updated 29 October 2026",
  sections: [
    {
      title: "Who we are",
      paragraphs: [
        "Envelette is a trading name of MARTZEY LTD, a company registered in England and Wales (company number 14466643). Our registered office is 86–90 Paul Street, London, EC2A 4NE, United Kingdom.",
        `You can email us at ${CONTACT_EMAIL} about anything, including questions, problems with a card and refunds.`,
      ],
    },
    {
      title: "What you're buying",
      paragraphs: [
        "An Envelette card is an interactive digital card that opens from a link in a web browser. Nothing is posted. Each card you buy is yours to send to one person or share with a few, by link or by email from us.",
        "The price of each card is shown on the site and in your basket before you pay. You pay once per card. There's no subscription.",
      ],
    },
    {
      title: "Making your card",
      paragraphs: [
        "You can design a card yourself, start from one of our designs, or have our AI write it from what you tell us. Please read your card through before you buy it: what you see in the preview is what they'll get.",
        "You're responsible for what you put on a card, including the words and any photos, and you must have the right to use them. Please don't use our cards for anything unlawful, hateful, threatening or harassing, to pretend to be someone else, or to share someone's private details or photos without their permission. If a card breaks these rules we may take it down, and we won't refund it.",
      ],
    },
    {
      title: "Paying",
      paragraphs: [
        "Payments are taken securely by Stripe. We never see your full card details. Your order is accepted once your payment goes through, and we'll email you a receipt.",
      ],
    },
    {
      title: "Getting your cards",
      paragraphs: [
        "Your cards are ready as soon as you've paid. You'll see each card's link straight away to share however you like, and if you asked us to email a card to someone, we send it then. Cards are kept at their links so they can be opened again later.",
      ],
    },
    {
      title: "Cancelling",
      paragraphs: [
        "Normally you can cancel something you buy online within 14 days. Because our cards are digital and you get them straight away, that right ends once a card has been delivered to you. At checkout we ask you to agree to this before you pay.",
        "If you ever think you've been charged by mistake, email us and we'll sort it out.",
      ],
    },
    {
      title: "If something goes wrong",
      paragraphs: [
        "Your card should work as we describe it. If it doesn't, for example it won't open or something on it is broken, email us and we'll fix it. If we can't, we'll give you a refund.",
        "This doesn't affect your legal rights. Under the Consumer Rights Act 2015, digital content you buy must be of satisfactory quality, fit for purpose and as described, and you're entitled to a repair or replacement, or some or all of your money back, if it isn't.",
      ],
    },
    {
      title: "Our responsibility to you",
      paragraphs: [
        "If we break these terms or are careless, we're responsible for loss or damage you suffer that was a foreseeable result. We're not responsible for loss that wasn't foreseeable, or for any business losses, as our cards are for personal use. Nothing in these terms limits our responsibility where it would be unlawful to, including for death or personal injury caused by our negligence, or for fraud.",
      ],
    },
    {
      title: "Your privacy",
      paragraphs: ["What we store and who can see a card is explained in our [privacy page](/privacy)."],
    },
    {
      title: "Changes to these terms",
      paragraphs: ["We may update these terms from time to time. The terms that apply to a card are the ones shown here when you bought it."],
    },
    {
      title: "The law that applies",
      paragraphs: [
        "These terms are governed by the law of England and Wales, and any dispute can be dealt with by the courts of England and Wales. If you live in Scotland or Northern Ireland, you can also bring a claim in your local courts.",
      ],
    },
  ],
};
