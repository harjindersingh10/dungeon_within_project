
CREATE TABLE customers (
 customer_id VARCHAR(36) PRIMARY KEY,
 fantasy_name VARCHAR(24) NOT NULL,
 age_group VARCHAR(40) NOT NULL,
 adventure_style VARCHAR(40) NOT NULL,
 self_description VARCHAR(50) NOT NULL,
 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE game_sessions (
 session_id VARCHAR(36) PRIMARY KEY,
 customer_id VARCHAR(36) NOT NULL,
 start_time DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 end_time DATETIME2 NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
 final_character_id VARCHAR(36) NULL,
 current_question INT NOT NULL DEFAULT 1,
 FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE scenarios (
 scenario_id INT IDENTITY(1,1) PRIMARY KEY,
 chapter VARCHAR(50) NOT NULL,
 scenario_text NVARCHAR(MAX) NOT NULL,
 difficulty INT NOT NULL DEFAULT 1,
 active BIT NOT NULL DEFAULT 1,
 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE scenario_options (
 option_id VARCHAR(36) PRIMARY KEY,
 scenario_id INT NOT NULL,
 option_text NVARCHAR(MAX) NOT NULL,
 courage_score INT NOT NULL DEFAULT 0,
 logic_score INT NOT NULL DEFAULT 0,
 empathy_score INT NOT NULL DEFAULT 0,
 leadership_score INT NOT NULL DEFAULT 0,
 risk_score INT NOT NULL DEFAULT 0,
 creativity_score INT NOT NULL DEFAULT 0,
 loyalty_score INT NOT NULL DEFAULT 0,
 chaos_score INT NOT NULL DEFAULT 0,
 FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id)
);

CREATE TABLE characters (
 character_id VARCHAR(36) PRIMARY KEY,
 character_name VARCHAR(80) NOT NULL UNIQUE,
 species VARCHAR(80) NOT NULL,
 title VARCHAR(120) NOT NULL,
 description NVARCHAR(MAX) NOT NULL,
 strengths NVARCHAR(MAX) NOT NULL,
 weaknesses NVARCHAR(MAX) NOT NULL,
 special_ability VARCHAR(120) NOT NULL,
 image_url VARCHAR(500) NULL
);

CREATE TABLE player_responses (
 response_id VARCHAR(36) PRIMARY KEY,
 session_id VARCHAR(36) NOT NULL,
 customer_id VARCHAR(36) NOT NULL,
 scenario_id INT NOT NULL,
 option_id VARCHAR(36) NOT NULL,
 question_number INT NOT NULL,
 time_taken_ms INT NOT NULL,
 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 FOREIGN KEY (session_id) REFERENCES game_sessions(session_id),
 FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
 FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id),
 FOREIGN KEY (option_id) REFERENCES scenario_options(option_id),
 CONSTRAINT uq_session_scenario UNIQUE (session_id, scenario_id)
);

CREATE TABLE character_assignments (
 assignment_id VARCHAR(36) PRIMARY KEY,
 session_id VARCHAR(36) NOT NULL UNIQUE,
 character_id VARCHAR(36) NOT NULL,
 confidence_score FLOAT NOT NULL,
 assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 FOREIGN KEY (session_id) REFERENCES game_sessions(session_id),
 FOREIGN KEY (character_id) REFERENCES characters(character_id)
);
