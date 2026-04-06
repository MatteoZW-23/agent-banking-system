CREATE TABLE `agent_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_id` int NOT NULL,
	`agent_code` varchar(50) NOT NULL,
	`merchant_id` varchar(50),
	`api_key_encrypted` text,
	`api_secret_encrypted` text,
	`float_account` varchar(50),
	`commission_rate` decimal(5,2),
	`is_primary` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_provider_agent` UNIQUE(`provider_id`,`agent_code`)
);
--> statement-breakpoint
CREATE TABLE `alert_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alert_type` enum('discrepancy','low_float','failed_reconciliation','suspicious_transaction','high_commission','other') NOT NULL,
	`provider_id` int,
	`threshold` decimal(15,2),
	`threshold_unit` enum('amount','percentage','count'),
	`is_active` boolean DEFAULT true,
	`notification_channels` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alert_config_id` int NOT NULL,
	`provider_id` int,
	`transaction_id` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`status` enum('triggered','acknowledged','resolved','dismissed') DEFAULT 'triggered',
	`acknowledged_by` int,
	`acknowledged_at` timestamp,
	`triggered_at` timestamp DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commission_structures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_id` int NOT NULL,
	`transaction_type` varchar(30),
	`min_amount` decimal(15,2) DEFAULT '0',
	`max_amount` decimal(15,2) DEFAULT '999999999',
	`commission_percentage` decimal(5,2),
	`commission_fixed` decimal(15,2) DEFAULT '0',
	`effective_from` date NOT NULL,
	`effective_to` date,
	`is_active` boolean DEFAULT true,
	CONSTRAINT `commission_structures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `csv_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`import_date` date NOT NULL,
	`total_records` int,
	`successful_records` int,
	`failed_records` int,
	`status` enum('pending','processing','completed','failed') DEFAULT 'pending',
	`error_log` text,
	`imported_by` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `csv_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_id` int NOT NULL,
	`settlement_date` date NOT NULL,
	`expected_total` decimal(15,2) NOT NULL,
	`actual_total` decimal(15,2),
	`discrepancy` decimal(15,2),
	`bank_reference` varchar(100),
	`settled_at` timestamp,
	`status` enum('pending','completed','failed','investigating') DEFAULT 'pending',
	`notes` text,
	CONSTRAINT `daily_settlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_provider_settlement_date` UNIQUE(`provider_id`,`settlement_date`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unique_code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(100),
	`phone` varchar(20),
	`status` enum('active','inactive','suspended') DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_unique_code_unique` UNIQUE(`unique_code`)
);
--> statement-breakpoint
CREATE TABLE `provider_floats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_id` int NOT NULL,
	`agent_registration_id` int,
	`opening_balance` decimal(15,2) NOT NULL,
	`current_balance` decimal(15,2) NOT NULL,
	`minimum_threshold` decimal(15,2) DEFAULT '0',
	`maximum_threshold` decimal(15,2),
	`last_reconciled_at` timestamp,
	`reconciled_by` int,
	`notes` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_floats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('mobile_money','bank','fintech','aggregator') NOT NULL,
	`agent_service_name` varchar(100),
	`api_endpoint` varchar(255),
	`auth_type` enum('oauth2','apikey','basic','mtls','none') NOT NULL,
	`auth_config` json,
	`webhook_url` varchar(255),
	`settlement_account` varchar(50),
	`is_active` boolean DEFAULT true,
	`last_sync_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `providers_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `transaction_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` int NOT NULL,
	`flag_type` enum('suspicious_pattern','unusual_amount','timing_anomaly','duplicate_risk','fraud_risk','other') NOT NULL,
	`risk_score` decimal(3,2),
	`reason` text NOT NULL,
	`llm_analysis` json,
	`status` enum('flagged','reviewed','resolved','false_positive') DEFAULT 'flagged',
	`reviewed_by` int,
	`reviewed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `transaction_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider_id` int NOT NULL,
	`agent_registration_id` int,
	`employee_code` varchar(20),
	`provider_reference` varchar(200) NOT NULL,
	`internal_reference` varchar(100) NOT NULL,
	`type` enum('cash_in','cash_out','send_money','receive_money','bill_payment','airtime','data_bundle','ticket_purchase','bank_transfer','salary_disbursement','float_purchase','float_redemption') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`fee` decimal(15,2) DEFAULT '0',
	`tax` decimal(15,2) DEFAULT '0',
	`net_amount` decimal(15,2),
	`customer_phone` varchar(15),
	`customer_national_id` varchar(20),
	`customer_name` varchar(100),
	`status` enum('pending','processing','completed','failed','reversed','disputed') DEFAULT 'pending',
	`failure_reason` text,
	`reconciliation_status` enum('unreconciled','matched','mismatch','investigating') DEFAULT 'unreconciled',
	`transaction_time` timestamp NOT NULL,
	`provider_processed_at` timestamp,
	`synced_at` timestamp DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_internal_reference_unique` UNIQUE(`internal_reference`),
	CONSTRAINT `unique_provider_ref` UNIQUE(`provider_id`,`provider_reference`)
);
--> statement-breakpoint
CREATE INDEX `idx_agent_reg_provider` ON `agent_registrations` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_alert_config_type` ON `alert_configurations` (`alert_type`);--> statement-breakpoint
CREATE INDEX `idx_alert_config_provider` ON `alert_configurations` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_alert_history_config` ON `alert_history` (`alert_config_id`);--> statement-breakpoint
CREATE INDEX `idx_alert_history_provider` ON `alert_history` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_alert_history_transaction` ON `alert_history` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_alert_history_status` ON `alert_history` (`status`);--> statement-breakpoint
CREATE INDEX `idx_alert_history_triggered_at` ON `alert_history` (`triggered_at`);--> statement-breakpoint
CREATE INDEX `idx_commission_provider` ON `commission_structures` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_commission_effective_from` ON `commission_structures` (`effective_from`);--> statement-breakpoint
CREATE INDEX `idx_csv_imports_provider` ON `csv_imports` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_csv_imports_date` ON `csv_imports` (`import_date`);--> statement-breakpoint
CREATE INDEX `idx_settlement_provider` ON `daily_settlements` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_settlement_date` ON `daily_settlements` (`settlement_date`);--> statement-breakpoint
CREATE INDEX `idx_employees_unique_code` ON `employees` (`unique_code`);--> statement-breakpoint
CREATE INDEX `idx_floats_provider` ON `provider_floats` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_floats_agent_reg` ON `provider_floats` (`agent_registration_id`);--> statement-breakpoint
CREATE INDEX `idx_providers_name` ON `providers` (`name`);--> statement-breakpoint
CREATE INDEX `idx_providers_category` ON `providers` (`category`);--> statement-breakpoint
CREATE INDEX `idx_flags_transaction` ON `transaction_flags` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `idx_flags_type` ON `transaction_flags` (`flag_type`);--> statement-breakpoint
CREATE INDEX `idx_flags_status` ON `transaction_flags` (`status`);--> statement-breakpoint
CREATE INDEX `idx_transactions_provider` ON `transactions` (`provider_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_employee` ON `transactions` (`employee_code`);--> statement-breakpoint
CREATE INDEX `idx_transactions_time` ON `transactions` (`transaction_time`);--> statement-breakpoint
CREATE INDEX `idx_transactions_recon_status` ON `transactions` (`reconciliation_status`);