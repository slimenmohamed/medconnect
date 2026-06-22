package com.medconnect.appointment.messaging;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Topologie RabbitMQ utilisée par MedConnect.
 *
 *  Exchange "medconnect.exchange" (topic)
 *
 *   Routing key "appointment.confirmed"  -> queue "appointment.confirmed.q"
 *      Producteur : appointment-service (ici)
 *      Consommateur : medical-records-service (Node.js)
 *
 *   Routing key "prescription.created"   -> queue "prescription.created.q"
 *      Producteur : medical-records-service (Node.js)
 *      Consommateur : appointment-service (ici, voir PrescriptionEventListener)
 *
 * Toutes les queues sont durables pour survivre à un redémarrage broker.
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "medconnect.exchange";

    public static final String APPOINTMENT_CONFIRMED_KEY = "appointment.confirmed";
    public static final String APPOINTMENT_CONFIRMED_QUEUE = "appointment.confirmed.q";

    public static final String PRESCRIPTION_CREATED_KEY = "prescription.created";
    public static final String PRESCRIPTION_CREATED_QUEUE = "prescription.created.q";

    @Bean
    public TopicExchange medconnectExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue appointmentConfirmedQueue() {
        return QueueBuilder.durable(APPOINTMENT_CONFIRMED_QUEUE).build();
    }

    @Bean
    public Queue prescriptionCreatedQueue() {
        return QueueBuilder.durable(PRESCRIPTION_CREATED_QUEUE).build();
    }

    @Bean
    public Binding appointmentConfirmedBinding(Queue appointmentConfirmedQueue, TopicExchange medconnectExchange) {
        return BindingBuilder.bind(appointmentConfirmedQueue).to(medconnectExchange).with(APPOINTMENT_CONFIRMED_KEY);
    }

    @Bean
    public Binding prescriptionCreatedBinding(Queue prescriptionCreatedQueue, TopicExchange medconnectExchange) {
        return BindingBuilder.bind(prescriptionCreatedQueue).to(medconnectExchange).with(PRESCRIPTION_CREATED_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter conv) {
        RabbitTemplate t = new RabbitTemplate(cf);
        t.setMessageConverter(conv);
        return t;
    }
}
