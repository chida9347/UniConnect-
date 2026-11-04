-- Optional demo records for a newly created database.
-- These are clearly marked sample records, NOT real Kalasalingam faculty or opportunities.
-- Run manually after creating an administrator account.
--
-- The administrator account must already exist. Replace :admin_id with its user id.

INSERT INTO faculty (name, department, designation, email, specialization, contact_info, created_at, updated_at)
VALUES
('[SAMPLE] Dr. A. Example', 'Computer Science and Engineering', 'Professor (Sample Record)', 'sample.faculty1@example.com', 'Distributed Systems (Sample)', '+91-00000-00001', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
('[SAMPLE] Dr. B. Example', 'Electronics and Communication Engineering', 'Associate Professor (Sample Record)', 'sample.faculty2@example.com', 'Embedded Systems (Sample)', '+91-00000-00002', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6));

INSERT INTO opportunities (title, description, category, organization, application_url, deadline, posted_by_id, created_at, updated_at)
VALUES
('[SAMPLE] Summer Internship Program', 'This is clearly identified sample data for testing the opportunities module. Replace it with an official listing.', 'INTERNSHIP', 'Sample Organization', 'https://example.com/internship', DATE_ADD(CURDATE(), INTERVAL 30 DAY), :admin_id, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)),
('[SAMPLE] Campus Hackathon', 'This is clearly identified sample data for testing the opportunities module. Replace it with an official listing.', 'HACKATHON', 'Sample University Department', 'https://example.com/hackathon', DATE_ADD(CURDATE(), INTERVAL 14 DAY), :admin_id, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6));
