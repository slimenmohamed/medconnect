package com.medconnect.appointment.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publisher RabbitMQ pour les événements émis par appointment-service.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishConfirmed(AppointmentConfirmedEvent event) {
        log.info("[RabbitMQ ASYNC #1] Publish {} -> {}", RabbitConfig.APPOINTMENT_CONFIRMED_KEY, event);
        rabbitTemplate.convertAndSend(
                RabbitConfig.EXCHANGE,
                RabbitConfig.APPOINTMENT_CONFIRMED_KEY,
                event
        );
    }

    /** Scénario ASYNC #3 : publie l'annulation d'un RDV. */
    public void publishCancelled(AppointmentCancelledEvent event) {
        log.info("[RabbitMQ ASYNC #3] Publish {} -> {}", RabbitConfig.APPOINTMENT_CANCELLED_KEY, event);
        rabbitTemplate.convertAndSend(
                RabbitConfig.EXCHANGE,
                RabbitConfig.APPOINTMENT_CANCELLED_KEY,
                event
        );
    }
}
