import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'feiyi_culture',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function initDB() {
  try {
    // 先创建数据库（如果不存在）
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.end();
    
    // 创建连接池
    pool = mysql.createPool(dbConfig);
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS userlist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT '',
        email VARCHAR(100) DEFAULT '',
        avatar VARCHAR(255) DEFAULT '',
        is_admin TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id INT PRIMARY KEY AUTO_INCREMENT,
        id INT NOT NULL,
        comment TEXT NOT NULL,
        createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TINYINT DEFAULT 0,
        audit_reason TEXT,
        audit_time TIMESTAMP NULL,
        audit_id INT DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        id INT NOT NULL,
        parent_comment_id INT DEFAULT NULL,
        comment TEXT NOT NULL,
        createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TINYINT DEFAULT 0,
        audit_reason TEXT,
        audit_time TIMESTAMP NULL,
        audit_id INT DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        icon VARCHAR(50) DEFAULT '',
        display_order INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(255) DEFAULT '',
        badge VARCHAR(20) DEFAULT '',
        stock INT DEFAULT 100,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        order_no VARCHAR(50) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        receiver VARCHAR(50) NOT NULL DEFAULT '',
        phone VARCHAR(20) NOT NULL DEFAULT '',
        province VARCHAR(50) NOT NULL DEFAULT '',
        city VARCHAR(50) NOT NULL DEFAULT '',
        district VARCHAR(50) NOT NULL DEFAULT '',
        address VARCHAR(500) NOT NULL DEFAULT '',
        remark VARCHAR(500),
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT '待付款',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        image VARCHAR(255) DEFAULT '',
        spec VARCHAR(50) DEFAULT '',
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 兼容旧表：补充可能缺失的字段
    try { await pool.execute('ALTER TABLE order_items ADD COLUMN image VARCHAR(255) DEFAULT \'\''); } catch {}
    try { await pool.execute('ALTER TABLE order_items ADD COLUMN spec VARCHAR(50) DEFAULT \'\''); } catch {}

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS nav_menu (
        id INT PRIMARY KEY AUTO_INCREMENT,
        menu_name VARCHAR(50) NOT NULL,
        menu_url VARCHAR(100) NOT NULL,
        menu_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS culture_content (
        id INT PRIMARY KEY AUTO_INCREMENT,
        section VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT,
        image_url VARCHAR(255) DEFAULT '',
        icon VARCHAR(50) DEFAULT '',
        display_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS danmaku (
        id INT PRIMARY KEY AUTO_INCREMENT,
        content TEXT NOT NULL,
        color VARCHAR(20) DEFAULT '#ffffff',
        speed INT DEFAULT 8,
        is_active TINYINT DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS banned_words (
        id INT PRIMARY KEY AUTO_INCREMENT,
        word VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ai_chats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        session_id VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        question TEXT NOT NULL,
        option_a VARCHAR(200) NOT NULL,
        option_b VARCHAR(200) NOT NULL,
        option_c VARCHAR(200) NOT NULL,
        option_d VARCHAR(200) NOT NULL,
        answer TINYINT NOT NULL DEFAULT 0,
        display_order INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS culture_overview (
        id INT PRIMARY KEY AUTO_INCREMENT,
        icon VARCHAR(50) DEFAULT '',
        title VARCHAR(100) NOT NULL,
        description TEXT,
        link_url VARCHAR(255) DEFAULT '/folklore',
        display_order INT DEFAULT 0,
        is_active TINYINT DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wrong_questions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        question_data JSON NOT NULL,
        user_answer JSON,
        wrong_count INT DEFAULT 1,
        last_wrong_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_question (user_id, question_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS game_progress (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        score INT DEFAULT 0,
        level_stars JSON,
        unlocked_levels INT DEFAULT 1,
        max_combo INT DEFAULT 0,
        visited_regions JSON,
        artisan_title VARCHAR(50) DEFAULT '初级学徒',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 初始化数据
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM userlist');
    if (userCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO userlist (username, password, phone, email, is_admin) VALUES
        ('admin', '$2a$10$aXUZhEtN69zlQbYM/D.vwOsna04ZVT3u2Q6NRe0smKzDVwjZ0YSRu', '13800000000', 'admin@feiyi-culture.com', 1),
        ('szh', '$2a$10$aXUZhEtN69zlQbYM/D.vwOsna04ZVT3u2Q6NRe0smKzDVwjZ0YSRu', '13800000001', 'szh@test.com', 1),
        ('testuser', '$2a$10$aXUZhEtN69zlQbYM/D.vwOsna04ZVT3u2Q6NRe0smKzDVwjZ0YSRu', '13800000002', 'test@test.com', 0)
      `);
    }

    const [postCount] = await pool.execute('SELECT COUNT(*) as count FROM posts');
    if (postCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO posts (id, comment, createtime, status) VALUES
        (2, '今天参观了苏州刺绣博物馆，被苏绣的精美技艺深深震撼！一根丝线可以劈成1/128根使用，这种精湛的手艺真的让人叹为观止。', '2026-07-08 14:30:00', 1),
        (3, '景德镇的青花瓷真的太美了！千年窑火不断，每一件瓷器都承载着匠人的心血。', '2026-07-07 10:15:00', 1),
        (2, '剪纸艺术真的很神奇，一把剪刀就能剪出万千世界。分享一下我的作品，请大家多多指教！', '2026-07-06 16:45:00', 1),
        (3, '京剧脸谱的色彩太丰富了，每种颜色都有特定的含义。最近在学习画脸谱，感觉很有趣！', '2026-07-05 11:00:00', 1),
        (2, '四川的蜀绣也很有名，针法独特，色彩鲜艳。有机会一定要去成都看看！', '2026-07-04 15:30:00', 1)
      `);
    }

    const [commentCount] = await pool.execute('SELECT COUNT(*) as count FROM comments');
    if (commentCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO comments (post_id, id, parent_comment_id, comment, createtime, status) VALUES
        (1, 3, NULL, '苏绣确实很美！我之前也去参观过，被双面绣作品深深震撼。', '2026-07-08 15:00:00', 1),
        (1, 2, 1, '苏绣讲究针脚细腻、色彩典雅，确实需要长期的练习和耐心。', '2026-07-08 15:30:00', 1),
        (2, 2, NULL, '景德镇制瓷技艺已经传承1300年了，72道工序铸就匠心传奇！', '2026-07-07 11:00:00', 1),
        (2, 3, NULL, '青花瓷远销海内外，是中国陶瓷文化的瑰宝！', '2026-07-07 11:30:00', 1),
        (3, 3, NULL, '剪纸艺术遍布全国各地，每个地方都有自己的特色！', '2026-07-06 17:00:00', 1),
        (3, 2, 5, '陕西剪纸尤其有名，红色福字图案最喜庆！', '2026-07-06 17:30:00', 1),
        (4, 2, NULL, '京剧被誉为国粹，每一个眼神、每一个动作都蕴含深厚文化内涵！', '2026-07-05 12:00:00', 1),
        (5, 3, NULL, '蜀绣针法多达12种，双面异色绣更是一绝！', '2026-07-04 16:00:00', 1)
      `);
    }

    const [categoryCount] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    if (categoryCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO categories (name, icon, display_order) VALUES
        ('传统工艺', '🏺', 1),
        ('传统服饰', '🧵', 2),
        ('传统美食', '🍵', 3),
        ('传统乐器', '🎵', 4),
        ('传统书画', '🖼️', 5)
      `);
    }

    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    if (productCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO products (category_id, name, description, price, image_url, badge, stock) VALUES
        (1, '苏绣手工团扇', '苏州刺绣工艺，双面绣技法，绘有牡丹图案，精美绝伦', 168, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Suzhou%20embroidery%20fan%20with%20peony%20pattern%2C%20elegant%20handicraft&image_size=square', '非遗精选', 100),
        (1, '景德镇青花瓷茶杯', '正宗景德镇瓷器，手工绘制青花山水图案，釉色温润', 128, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Jingdezhen%20blue%20and%20white%20porcelain%20tea%20cup%20with%20landscape%20painting%2C%20traditional%20Chinese%20style&image_size=square', '热销', 150),
        (1, '剪纸艺术装饰画', '陕西剪纸技艺，红色福字图案，喜庆吉祥', 68, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20paper%20cutting%20art%20decoration%2C%20red%20color%2C%20Fu%20character%20pattern&image_size=square', '', 200),
        (1, '景泰蓝花瓶', '北京景泰蓝工艺，铜胎掐丝珐琅，色彩绚丽', 398, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20cloisonne%20vase%2C%20jingtailan%20craftsmanship%2C%20colorful%20enamel%20decoration&image_size=square', '非遗臻品', 80),
        (1, '紫砂茶壶', '宜兴紫砂工艺，手工制作，茶香四溢', 598, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yixing%20purple%20clay%20teapot%2C%20Chinese%20traditional%20zisha%20craftsmanship%2C%20elegant%20design&image_size=square', '非遗臻品', 60),
        (2, '蜀锦丝巾', '四川成都蜀锦织造技艺，传统纹样，色泽艳丽', 268, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Shu%20brocade%20silk%20scarf%2C%20ancient%20pattern%2C%20elegant%20design&image_size=square', '', 120),
        (2, '汉服配饰套装', '传统汉服配饰，发簪、玉佩、香囊组合套装', 198, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Hanfu%20accessories%2C%20hairpin%2C%20jade%20pendant%2C%20sachet%2C%20elegant%20style&image_size=square', '', 100),
        (3, '西湖龙井礼盒', '正宗西湖龙井茶，明前特级，清香四溢', 388, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20West%20Lake%20Longjing%20green%20tea%20gift%20box%2C%20premium%20quality%2C%20elegant%20packaging&image_size=square', '特产', 80),
        (3, '月饼礼盒', '传统广式月饼，多种口味组合，精美包装', 168, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20mooncake%20gift%20box%2C%20Cantonese%20style%2C%20elegant%20packaging&image_size=square', '', 200),
        (4, '古琴书签套装', '古琴造型书签，金属材质，精美蚀刻图案', 48, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20guqin%20style%20bookmark%20set%2C%20metal%20material%2C%20elegant%20design&image_size=square', '', 300),
        (1, '东阳木雕摆件', '浙江东阳木雕，精雕细琢，栩栩如生', 298, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20Dongyang%20wood%20carving%20ornament%2C%20intricate%20detail%2C%20traditional%20craftsmanship&image_size=square', '', 100),
        (5, '书法作品', '名家手书，书法真迹，可定制内容', 888, 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20calligraphy%20artwork%2C%20elegant%20brush%20writing%2C%20artistic%20style&image_size=square', '', 50)
      `);
    }

    const [danmakuCount] = await pool.execute('SELECT COUNT(*) as count FROM danmaku');
    if (danmakuCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO danmaku (content, color, speed) VALUES
        ('中国拥有10000+项国家级非遗项目 🌏', '#B22222', 10),
        ('苏绣可以把一根丝线劈成1/128根使用 🪡', '#DAA520', 8),
        ('景德镇制瓷技艺已传承1300年 🏺', '#B22222', 9),
        ('京剧被誉为中国国粹 🎭', '#DAA520', 7),
        ('剪纸艺术一把剪刀剪出万千世界 ✂️', '#B22222', 11),
        ('蜀绣针法多达12种 🌈', '#DAA520', 8),
        ('端午节被列入人类非遗代表作名录 🟢', '#B22222', 10),
        ('昆曲是百戏之祖 🎵', '#DAA520', 9),
        ('景泰蓝又称铜胎掐丝珐琅 🎨', '#B22222', 12),
        ('古琴是中国最早的弹拨乐器 🎶', '#DAA520', 8),
        ('宣纸被称为纸中之王 📜', '#B22222', 10),
        ('皮影戏是最早的动画形式 🎬', '#DAA520', 9),
        ('中国结象征吉祥如意 🧧', '#B22222', 7),
        ('榫卯结构不用一颗钉子 🔨', '#DAA520', 11),
        ('普洱茶越陈越香 🍵', '#B22222', 8)
      `);
    }

    const [questionCount] = await pool.execute('SELECT COUNT(*) as count FROM questions');
    if (questionCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO questions (question, option_a, option_b, option_c, option_d, answer, display_order) VALUES
        ('景泰蓝属于哪种工艺？', '陶瓷工艺', '金属工艺', '纺织工艺', '木雕工艺', 1, 1),
        ('以下哪个属于传统美术类非遗？', '剪纸', '京剧', '皮影戏', '古琴', 0, 2),
        ('苏绣起源于哪个省份？', '四川', '广东', '江苏', '浙江', 2, 3),
        ('景德镇以哪种瓷器闻名？', '青瓷', '白瓷', '青花瓷', '黑瓷', 2, 4),
        ('京剧脸谱中红色代表什么性格？', '奸诈', '正直', '勇猛', '忠诚', 3, 5),
        ('以下哪个不属于四大名绣？', '苏绣', '湘绣', '粤绣', '蜀绣', 3, 6),
        ('昆曲被称为？', '百戏之祖', '国粹', '国剧', '梨园', 0, 7),
        ('端午节是为了纪念谁？', '孔子', '屈原', '李白', '杜甫', 1, 8)
      `);
    }

    const [overviewCount] = await pool.execute('SELECT COUNT(*) as count FROM culture_overview');
    if (overviewCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO culture_overview (icon, title, description, link_url, display_order) VALUES
        ('🪡', '传统技艺', '苏绣、陶瓷、景泰蓝等传统手工艺，每一件作品都凝聚着匠人的心血与智慧。', '/folklore', 1),
        ('🍵', '传统美食', '龙井茶、月饼、粽子等传统美食，承载着中华民族的饮食文化和节日习俗。', '/folklore', 2),
        ('🎭', '民俗节庆', '春节、端午节、中秋节等传统节日，代代相传的不仅是习俗，更是文化基因。', '/folklore', 3),
        ('🎵', '传统戏剧', '京剧、昆曲、皮影戏等传统戏剧，展现了中华民族的艺术才华和精神风貌。', '/folklore', 4)
      `);
    }

    const [navCount] = await pool.execute('SELECT COUNT(*) as count FROM nav_menu');
    if (navCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO nav_menu (menu_name, menu_url, menu_order, is_active) VALUES
        ('首页', '/', 1, 1),
        ('文化溯源', '/culture', 2, 1),
        ('民俗风采', '/folklore', 3, 1),
        ('互动专区', '/interactive', 4, 1),
        ('论坛', '/forum', 5, 1),
        ('文创商店', '/store', 6, 1),
        ('管理面板', '/manage', 7, 1)
      `);
    }

    const [orderCount] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    if (orderCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO orders (order_no, user_id, receiver, phone, province, city, district, address, remark, total_amount, status, created_at) VALUES
        ('ORD202607010001', 2, '张三', '13800138001', '江苏省', '苏州市', '姑苏区', '观前街123号', '', 168.00, '已完成', '2026-07-01 14:30:00'),
        ('ORD202607020002', 3, '李四', '13800138002', '江西省', '景德镇市', '珠山区', '陶瓷大道456号', '请尽快发货', 398.00, '已发货', '2026-07-02 10:15:00'),
        ('ORD202607030003', 2, '王五', '13800138003', '北京市', '北京市', '朝阳区', '建国路789号', '', 68.00, '待付款', '2026-07-03 09:00:00')
      `);

      await pool.execute(`
        INSERT INTO order_items (order_id, product_id, product_name, image, spec, quantity, unit_price, subtotal) VALUES
        (1, 1, '苏绣手工团扇', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20Suzhou%20embroidery%20fan%20with%20peony%20pattern%2C%20elegant%20handicraft&image_size=square', '精美礼盒装', 1, 168.00, 168.00),
        (2, 4, '景泰蓝花瓶', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20cloisonne%20vase%2C%20jingtailan%20craftsmanship%2C%20colorful%20enamel%20decoration&image_size=square', '标准款', 1, 398.00, 398.00),
        (3, 3, '剪纸艺术装饰画', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20paper%20cutting%20art%20decoration%2C%20red%20color%2C%20Fu%20character%20pattern&image_size=square', '红色福字款', 1, 68.00, 68.00)
      `);
    }

    const [bannedWordCount] = await pool.execute('SELECT COUNT(*) as count FROM banned_words');
    if (bannedWordCount[0].count === 0) {
      await pool.execute(`
        INSERT INTO banned_words (word) VALUES
        ('暴力'), ('色情'), ('赌博'), ('毒品'), ('诈骗'), ('反动')
      `);
    }

    console.log('MySQL数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

let initialized = false;

export async function getDB() {
  if (!initialized) {
    await initDB();
    initialized = true;
  }
  return pool;
}

export default getDB;