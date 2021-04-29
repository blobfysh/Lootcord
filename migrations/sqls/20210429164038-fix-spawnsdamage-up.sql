/*
spawnsdamage userId relies on polymorphic association (userId can be from scores or server_scores table), so I can't have foreign key on the table
https://stackoverflow.com/questions/441001/possible-to-do-a-mysql-foreign-key-to-one-of-two-possible-tables
*/
ALTER TABLE spawnsdamage DROP FOREIGN KEY spawnsdamage_ibfk_2;
