const { Queue, Worker } = require('bullmq')

class InMemoryQueue {
  constructor(name, processor) {
    this.name = name
    this.processor = processor
    this.jobs = []
    this.active = false
    console.log(`[Queue] Initialized in-memory fallback queue for "${name}"`)
  }

  async add(jobName, data) {
    const job = { id: Math.random().toString(36).substring(7), name: jobName, data }
    this.jobs.push(job)
    console.log(`[Queue - InMemory] Job added: ${jobName} (${job.id})`)
    this.processQueue()
    return job
  }

  async processQueue() {
    if (this.active || this.jobs.length === 0) return
    this.active = true

    while (this.jobs.length > 0) {
      const job = this.jobs.shift()
      console.log(`[Queue - InMemory] Processing job: ${job.name} (${job.id})`)
      try {
        await this.processor(job)
        console.log(`[Queue - InMemory] Job completed: ${job.name} (${job.id})`)
      } catch (err) {
        console.error(`[Queue - InMemory] Job failed: ${job.name} (${job.id})`, err)
      }
    }

    this.active = false
  }
}

function createQueue(name, processor) {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    return new InMemoryQueue(name, processor)
  }

  try {
    const queue = new Queue(name, { connection: { url: redisUrl } })
    const worker = new Worker(name, processor, { connection: { url: redisUrl } })

    worker.on('failed', (job, err) => {
      console.error(`[Queue - BullMQ] Job failed in worker "${name}":`, job?.id, err)
    })

    console.log(`[Queue] Initialized BullMQ queue for "${name}"`)
    return queue
  } catch (err) {
    console.warn(`[Queue] Failed to initialize BullMQ for "${name}". Falling back to InMemoryQueue.`, err.message)
    return new InMemoryQueue(name, processor)
  }
}

module.exports = {
  createQueue
}
