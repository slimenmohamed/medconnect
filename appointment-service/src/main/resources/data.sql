-- Jeu de données de démo, idempotent (compatible H2 mode MySQL + MySQL 8).
-- INSERT IGNORE = ignore les violations de contrainte unique (email)
-- -> permet de relancer le service sans plantage.

INSERT IGNORE INTO patients (nom, prenom, email, telephone, keycloak_id) VALUES
  ('Alaoui',  'Sara',   'sara.patient@medconnect.local',   '0600000001', NULL),
  ('Bennani', 'Karim',  'karim.patient2@medconnect.local', '0600000002', NULL),
  ('Cherkaoui','Nadia', 'nadia.patient3@medconnect.local', '0600000003', NULL);

INSERT IGNORE INTO doctors (id, nom, prenom, specialite, keycloak_id) VALUES
  (1, 'Idrissi',  'Yassine', 'Cardiologie',  NULL),
  (2, 'Lahlou',   'Fatima',  'Pédiatrie',    NULL),
  (3, 'Mansouri', 'Omar',    'Dermatologie', NULL);

INSERT IGNORE INTO appointments (id, patient_id, doctor_id, date_heure, statut, motif) VALUES
  (1, 1, 1, '2026-07-15 10:00:00', 'PENDING',   'Consultation cardio'),
  (2, 2, 2, '2026-07-16 11:30:00', 'CONFIRMED', 'Visite pédiatrique'),
  (3, 3, 3, '2026-07-17 09:00:00', 'PENDING',   'Lésion cutanée');
