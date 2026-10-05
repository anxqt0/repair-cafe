-- Repair Café schema for Azure SQL. Safe to re-run; it does not remove existing bookings.

IF OBJECT_ID('volunteers', 'U') IS NULL
BEGIN
  CREATE TABLE volunteers (
    id        INT            IDENTITY(1,1) PRIMARY KEY,
    name      NVARCHAR(100)  NOT NULL,
    specialty NVARCHAR(80)   NOT NULL,
    bio       NVARCHAR(300)  NOT NULL,
    active    BIT            NOT NULL DEFAULT 1,
    created   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('repair_appointments', 'U') IS NULL
BEGIN
  CREATE TABLE repair_appointments (
    id                 INT            IDENTITY(1,1) PRIMARY KEY,
    volunteer_id       INT            NOT NULL,
    visitor_name       NVARCHAR(120)  NOT NULL,
    item_name          NVARCHAR(120)  NOT NULL,
    repair_type        NVARCHAR(80)   NOT NULL,
    issue_description  NVARCHAR(1000) NULL,
    cancel_token_hash  CHAR(64)       NULL,
    slot               DATETIME2      NOT NULL,
    created            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_repair_appointments_volunteer
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
  );
END;

IF COL_LENGTH('repair_appointments', 'cancel_token_hash') IS NULL
  ALTER TABLE repair_appointments ADD cancel_token_hash CHAR(64) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_repair_appointments_volunteer_slot')
  CREATE UNIQUE INDEX ux_repair_appointments_volunteer_slot
    ON repair_appointments (volunteer_id, slot);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_repair_appointments_slot')
  CREATE INDEX ix_repair_appointments_slot ON repair_appointments (slot);
