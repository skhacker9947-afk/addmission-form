-- Create the admissions table in the public schema
-- Drop and recreate if column names have changed
DROP TABLE IF EXISTS admissions;

CREATE TABLE admissions (
  id              SERIAL PRIMARY KEY,
  student_name    VARCHAR(255)  NOT NULL,
  dob             DATE          NOT NULL,
  gender          VARCHAR(20)   NOT NULL,
  blood_group     VARCHAR(10),
  selected_class  VARCHAR(50)   NOT NULL,
  father_name     VARCHAR(255)  NOT NULL,
  mother_name     VARCHAR(255)  NOT NULL,
  student_email   VARCHAR(255)  NOT NULL,
  phone           VARCHAR(15)   NOT NULL,
  prev_school     VARCHAR(255),
  address         TEXT          NOT NULL,
  city            VARCHAR(100)  NOT NULL,
  pincode         VARCHAR(10)   NOT NULL,
  created_at      TIMESTAMP     DEFAULT NOW()
);
