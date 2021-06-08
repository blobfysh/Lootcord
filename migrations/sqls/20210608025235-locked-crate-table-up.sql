CREATE TABLE IF NOT EXISTS locked_crate_channels (
    channelId VARCHAR(255),
	pingRoleId VARCHAR(255) DEFAULT NULL,
	PRIMARY KEY (channelId)
) ENGINE = InnoDB;
