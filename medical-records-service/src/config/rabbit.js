/**
 * Connexion RabbitMQ (amqplib) + publisher/consumer.
 *
 * Topologie (mirror de RabbitConfig.java côté Java) :
 *  Exchange "medconnect.exchange" (topic)
 *   - appointment.confirmed -> queue "appointment.confirmed.q"  (CONSUMED ici)
 *   - prescription.created  -> queue "prescription.created.q"   (PUBLISHED ici)
 */
const amqp = require('amqplib');

const EXCHANGE = 'medconnect.exchange';
const APPOINTMENT_CONFIRMED_KEY   = 'appointment.confirmed';
const APPOINTMENT_CONFIRMED_QUEUE = 'appointment.confirmed.q';
const PRESCRIPTION_CREATED_KEY    = 'prescription.created';
const PRESCRIPTION_CREATED_QUEUE  = 'prescription.created.q';

let channel = null;

async function initRabbit(url, onAppointmentConfirmed) {
  let connection = null;
  for (let i = 0; i < 15 && !connection; i++) {
    try {
      connection = await amqp.connect(url);
    } catch (e) {
      console.warn(`[rabbit] retry ${i + 1}/15 - ${e.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (!connection) throw new Error('RabbitMQ injoignable après 15 tentatives');

  connection.on('error', err => console.error('[rabbit] connection error:', err.message));
  connection.on('close', () => console.warn('[rabbit] connection closed'));

  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  await channel.assertQueue(APPOINTMENT_CONFIRMED_QUEUE, { durable: true });
  await channel.bindQueue(APPOINTMENT_CONFIRMED_QUEUE, EXCHANGE, APPOINTMENT_CONFIRMED_KEY);

  await channel.assertQueue(PRESCRIPTION_CREATED_QUEUE, { durable: true });
  await channel.bindQueue(PRESCRIPTION_CREATED_QUEUE, EXCHANGE, PRESCRIPTION_CREATED_KEY);

  await channel.consume(
    APPOINTMENT_CONFIRMED_QUEUE,
    async msg => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log('[rabbit] <- appointment.confirmed', payload);
        await onAppointmentConfirmed(payload);
        channel.ack(msg);
      } catch (e) {
        console.error('[rabbit] error handling appointment.confirmed:', e.message);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  console.log('[rabbit] Connected, exchange + queues ready');
}

function publishPrescriptionCreated(event) {
  if (!channel) {
    console.warn('[rabbit] channel not ready, drop event');
    return;
  }
  channel.publish(
    EXCHANGE,
    PRESCRIPTION_CREATED_KEY,
    Buffer.from(JSON.stringify(event)),
    { contentType: 'application/json', persistent: true }
  );
  console.log('[rabbit] -> prescription.created', event);
}

module.exports = { initRabbit, publishPrescriptionCreated };
