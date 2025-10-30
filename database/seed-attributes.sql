-- Categories tablosuna public okuma erişimi ver
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON categories
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON categories
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON categories
FOR UPDATE
USING (auth.role() = 'authenticated');