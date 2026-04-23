import { db } from '@/lib/db'

async function main() {
  // Seed Contacts
  const existingContacts = await db.contact.count()
  if (existingContacts === 0) {
    await db.contact.createMany({
      data: [
        { name: 'John Smith', phone: '+1 234 567 8901', email: 'john@techsolutions.com', company: 'Tech Solutions Inc', location: 'New York, USA', tags: 'customer,vip', lastMessage: 'Thanks for the update!', status: 'active', score: 85, segments: 'VIP,Customer' },
        { name: 'Sarah Johnson', phone: '+44 7911 123456', email: 'sarah.j@company.co.uk', company: 'TechStart Ltd', location: 'London, UK', tags: 'lead,hot', lastMessage: 'Interested in your product', status: 'active', score: 72, segments: 'Lead,Hot' },
        { name: 'Mike Chen', phone: '+86 138 0013 8000', email: 'mike.chen@dragon.cn', company: 'Dragon Industries', location: 'Shanghai, China', tags: 'customer', lastMessage: 'Order confirmed', status: 'active', score: 90, segments: 'Customer,VIP' },
        { name: 'Emily Davis', phone: '+1 555 123 4567', email: 'emily.davis@mail.com', company: 'Freelance', location: 'Austin, USA', tags: 'prospect', lastMessage: '', status: 'inactive', score: 25, segments: 'Prospect' },
        { name: 'Alex Rivera', phone: '+34 612 345 678', email: 'alex@rivera.es', company: 'Rivera Wholesale', location: 'Madrid, Spain', tags: 'customer,wholesale', lastMessage: 'Bulk order inquiry', status: 'active', score: 68, segments: 'Customer,Wholesale' },
        { name: 'Lisa Wong', phone: '+852 9123 4567', email: 'lisa@pacific.hk', company: 'Pacific Trading', location: 'Hong Kong', tags: 'lead,hot', lastMessage: 'Price list request', status: 'active', score: 95, segments: 'VIP,Hot' },
        { name: 'David Brown', phone: '+61 4 1234 5678', email: 'david@outback.au', company: 'Outback Retail', location: 'Sydney, Australia', tags: 'customer', lastMessage: 'Delivery confirmed', status: 'active', score: 55, segments: 'Customer' },
        { name: 'Anna Mueller', phone: '+49 151 1234 5678', email: 'anna@berlintech.de', company: 'BerlinTech GmbH', location: 'Berlin, Germany', tags: 'prospect', lastMessage: '', status: 'inactive', score: 15, segments: 'Prospect,Lead' },
      ]
    })
    console.log('Seeded 8 contacts')
  }

  // Seed Campaigns
  const existingCampaigns = await db.campaign.count()
  if (existingCampaigns === 0) {
    await db.campaign.createMany({
      data: [
        { name: 'Product Launch Promo', status: 'active', total: 1000, sent: 452, delivered: 410, replies: 38, message: '🎉 Exciting news! Our new product is now available. Get 20% off with code LAUNCH20.' },
        { name: 'Weekly Newsletter', status: 'scheduled', total: 500, sent: 0, delivered: 0, replies: 0, message: '📰 This Week at EAJE: New features, tips & tricks, and community highlights.' },
        { name: 'Holiday Greetings', status: 'completed', total: 800, sent: 800, delivered: 756, replies: 92, message: '🎄 Happy Holidays from EAJE! Wishing you joy and success.' },
        { name: 'Flash Sale Alert', status: 'paused', total: 600, sent: 230, delivered: 210, replies: 15, message: '⚡ Flash Sale! 50% off for the next 2 hours only. Use code FLASH50.' },
        { name: 'Customer Follow-up', status: 'failed', total: 200, sent: 50, delivered: 45, replies: 3, message: 'Hi {name}! We noticed you haven\'t visited in a while.' },
      ]
    })
    console.log('Seeded 5 campaigns')
  }

  // Seed Auto-Reply Rules
  const existingRules = await db.autoReplyRule.count()
  if (existingRules === 0) {
    await db.autoReplyRule.createMany({
      data: [
        { trigger: 'hello', response: 'Hi there! Thanks for reaching out. We\'ll get back to you shortly.', matchType: 'contains', active: true },
        { trigger: 'price', response: 'Our pricing starts at $29/mo. Would you like a custom quote?', matchType: 'contains', active: true },
        { trigger: 'hours', response: 'We\'re available Mon-Fri, 9AM-6PM EST.', matchType: 'exact', active: false },
      ]
    })
    console.log('Seeded 3 auto-reply rules')
  }

  // Seed Scheduled Messages
  const existingScheduled = await db.scheduledMessage.count()
  if (existingScheduled === 0) {
    await db.scheduledMessage.createMany({
      data: [
        { message: 'Good morning! Here are today\'s deals...', recipients: 'All Customers (847)', date: '2025-03-20', time: '09:00', recurring: 'daily', status: 'pending' },
        { message: 'Weekly newsletter with product updates', recipients: 'Newsletter Subs (342)', date: '2025-03-22', time: '10:00', recurring: 'weekly', status: 'pending' },
        { message: 'Happy hour starts now! 50% off all items', recipients: 'VIP Customers (124)', date: '2025-03-18', time: '17:00', recurring: 'none', status: 'sent' },
        { message: 'Flash sale ending in 2 hours!', recipients: 'All Customers (847)', date: '2025-03-17', time: '22:00', recurring: 'none', status: 'failed' },
      ]
    })
    console.log('Seeded 4 scheduled messages')
  }

  // Seed Message Templates
  const existingTemplates = await db.messageTemplate.count()
  if (existingTemplates === 0) {
    await db.messageTemplate.createMany({
      data: [
        { name: 'Welcome Message', category: 'greeting', content: 'Hello {name}! 👋 Welcome to our business. How can we help you today?', starred: true, variables: 'name' },
        { name: 'Order Confirmation', category: 'transaction', content: 'Hi {name}, your order #{order_id} has been confirmed! Estimated delivery: {date}.', starred: true, variables: 'name,order_id,date' },
        { name: 'Flash Sale Alert', category: 'marketing', content: '🔥 FLASH SALE! {discount}% off on {product}! Use code {code} at checkout. Ends in {time}!', starred: false, variables: 'discount,product,code,time' },
        { name: 'Follow-up', category: 'follow-up', content: 'Hi {name}, just checking in! Did you get a chance to review our last proposal?', starred: false, variables: 'name' },
        { name: 'Thank You', category: 'greeting', content: 'Thank you for your purchase, {name}! 🎉 We appreciate your business.', starred: true, variables: 'name' },
        { name: 'Appointment Reminder', category: 'transaction', content: 'Reminder: Your appointment is scheduled for {date} at {time}. Reply YES to confirm or NO to reschedule.', starred: false, variables: 'date,time' },
      ]
    })
    console.log('Seeded 6 message templates')
  }

  // Seed Conversations for the first contact
  const existingConvos = await db.conversation.count()
  if (existingConvos === 0) {
    const contacts = await db.contact.findMany({ take: 3 })
    for (const contact of contacts) {
      await db.conversation.createMany({
        data: [
          { contactId: contact.id, contactName: contact.name, direction: 'incoming', content: 'Hi! I wanted to ask about your latest product offerings.' },
          { contactId: contact.id, contactName: contact.name, direction: 'outgoing', content: 'Of course! We just launched our new line. Let me send you the catalog.' },
          { contactId: contact.id, contactName: contact.name, direction: 'incoming', content: 'That would be great! Also, do you have any bulk pricing?' },
          { contactId: contact.id, contactName: contact.name, direction: 'outgoing', content: 'Yes, we offer tiered pricing for orders over 100 units. I\'ll include those details too.' },
          { contactId: contact.id, contactName: contact.name, direction: 'incoming', content: 'Perfect, looking forward to it!' },
          { contactId: contact.id, contactName: contact.name, direction: 'incoming', content: contact.lastMessage || 'Thanks!' },
        ]
      })
    }
    console.log('Seeded conversations for 3 contacts')
  }

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
