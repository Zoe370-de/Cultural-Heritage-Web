<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>匠心传承</h3>
          <p>千年匠心 · 非遗之美</p>
        </div>
        <div class="footer-section">
          <h4>快速导航</h4>
          <ul>
            <li><router-link to="/">首页</router-link></li>
            <li><router-link to="/culture">匠心地图</router-link></li>
            <li><router-link to="/community">互动社区</router-link></li>
            <li><router-link to="/store">文创馆</router-link></li>
            <li><router-link to="/profile">个人中心</router-link></li>
            <li><router-link to="/manage">管理面板</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p>邮箱: contact@jiangxin-culture.com</p>
          <p>电话: 400-123-4567</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 匠心传承 · 非遗文化</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 50px 0 20px;
  margin-top: 50px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.footer-section h3 {
  font-size: 20px;
  margin-bottom: 15px;
}

.footer-section h4 {
  font-size: 16px;
  margin-bottom: 15px;
}

.footer-section p {
  margin-bottom: 10px;
  opacity: 0.9;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 10px;
}

.footer-section ul li a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.footer-section ul li a:hover {
  opacity: 0.7;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0.8;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
</style>
