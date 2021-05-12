CREATE TABLE IF NOT EXISTS sales (
    item VARCHAR(255),
	price BIGINT,
    PRIMARY KEY (item)
) ENGINE = InnoDB;
