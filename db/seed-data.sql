-- Sample repair café volunteers. Re-running this script will not duplicate them.
INSERT INTO volunteers (name, specialty, bio)
SELECT source.name, source.specialty, source.bio
FROM (VALUES
  (N'Mali Srisuk', N'จักรยาน', N'ดูแลจักรยาน เบรก โซ่ และยาง'),
  (N'Anan Kongsawat', N'เครื่องใช้ไฟฟ้า', N'ช่วยวิเคราะห์อาการเครื่องใช้ไฟฟ้าขนาดเล็ก'),
  (N'Pim Suwannarat', N'เสื้อผ้าและสิ่งทอ', N'ซ่อมตะเข็บ ซิป และงานเย็บพื้นฐาน'),
  (N'Kornkrit Prasertsuk', N'อุปกรณ์อิเล็กทรอนิกส์', N'ตรวจสายไฟ อุปกรณ์เสียง และงานบัดกรีเบื้องต้น'),
  (N'Nattaya Petchroong', N'ของใช้ในบ้าน', N'ซ่อมของใช้ทั่วไป งานไม้ และของเล่น')
) AS source(name, specialty, bio)
WHERE NOT EXISTS (
  SELECT 1 FROM volunteers v WHERE v.name = source.name AND v.specialty = source.specialty
);
