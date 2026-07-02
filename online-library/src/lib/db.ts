import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "data", "library.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '一般',
      cover_color TEXT DEFAULT '#6366f1',
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      published_year INTEGER DEFAULT 2020,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      borrowed_at TEXT DEFAULT (datetime('now')),
      due_date TEXT NOT NULL,
      returned_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);

  const userCount = database.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    seedData(database);
  }
}

function seedData(database: Database.Database) {
  const adminHash = bcrypt.hashSync("admin123", 10);
  const userHash = bcrypt.hashSync("user123", 10);

  database.prepare(
    "INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, ?)"
  ).run("admin@library.jp", adminHash, "管理者", 1);

  database.prepare(
    "INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, ?)"
  ).run("user@library.jp", userHash, "山田太郎", 0);

  const books = [
    ["吾輩は猫である", "夏目漱石", "978-4-06-285123-4", "明治時代の知識人の生活をユーモラスに描いた日本文学の傑作。", "文学", "#8b5cf6", 3, 3, 1905],
    ["星の王子さま", "サン＝テグジュペリ", "978-4-06-285456-7", "砂漠に不時着した飛行士と小さな王子の出会いを描く不朽の名作。", "児童文学", "#f59e0b", 2, 2, 1943],
    ["ハリー・ポッターと賢者の石", "J.K.ローリング", "978-4-06-285789-0", "魔法学校ホグワーツでの冒険が始まるファンタジーの金字塔。", "ファンタジー", "#ef4444", 4, 4, 1997],
    ["1984年", "ジョージ・オーウェル", "978-4-06-286012-1", "全体主義社会を描いたディストピア小説の古典。", "SF", "#3b82f6", 2, 2, 1949],
    ["嫌われる勇気", "岸見一郎", "978-4-06-286345-3", "アドラー心理学を対話形式で解説したベストセラー。", "自己啓発", "#10b981", 3, 3, 2013],
    ["サピエンス全史", "ユヴァル・ノア・ハラリ", "978-4-06-286678-2", "人類の歴史を壮大な視点から描いた世界的ベストセラー。", "歴史", "#6366f1", 2, 2, 2011],
    ["こころ", "夏目漱石", "978-4-06-287012-5", "明治末期の知識人の内面を描いた心理小説の傑作。", "文学", "#a855f7", 2, 2, 1914],
    ["銀河鉄道999", "宮沢賢治", "978-4-06-287345-6", "幻想的な鉄道の旅を通じて人生の真理を描いた童話。", "児童文学", "#06b6d4", 2, 2, 1934],
    ["人間失格", "太宰治", "978-4-06-287678-3", "現代人の孤独と絶望を描いた太宰治の代表作。", "文学", "#64748b", 3, 3, 1948],
    ["思考の整理学", "外山滋比古", "978-4-06-288012-4", "創造的思考の方法論を平易に解説した名著。", "自己啓発", "#f97316", 2, 2, 1969],
    ["三体", "劉慈欣", "978-4-06-288345-7", "中国SFの金字塔。地球文明と三体文明の壮大な対決。", "SF", "#0ea5e9", 3, 3, 2008],
    ["ノルウェイの森", "村上春樹", "978-4-06-288678-9", "1960年代の東京を舞台にした青春と喪失の物語。", "文学", "#ec4899", 2, 2, 1987],
  ];

  const insertBook = database.prepare(`
    INSERT INTO books (title, author, isbn, description, category, cover_color, total_copies, available_copies, published_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const book of books) {
    insertBook.run(...book);
  }
}

export { getDb };
