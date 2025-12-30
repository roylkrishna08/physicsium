<script setup>
</script>

<template>
  <div class="privacy-container container">
    <div class="content card-glass">
      <h1 class="page-title">Privacy Policy</h1>
      <p class="last-updated">Last Updated: December 30, 2025</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Welcome to Physicsium ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, in accordance with the 
          <strong>Information Technology Act, 2000</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> of India.
        </p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
        <ul>
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register for an account (e.g., Mission 2027 Dashboard).</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
        </ul>
      </section>

      <section>
        <h2>3. Use of Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
        <ul>
            <li>Create and manage your account.</li>
            <li>Track your academic progress in labs and simulations.</li>
            <li>Email you regarding your account or order.</li>
            <li>Enable user-to-user communications.</li>
            <li>Monitor and analyze usage and trends to improve your experience.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cookies and Web Beacons</h2>
        <p>
            We may use cookies, web beacons, tracking pixels, and other tracking technologies on the Site to help customize the Site and improve your experience. 
            When you access the Site, your personal information is not collected through the use of tracking technology. 
            Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of the Site.
        </p>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>
            We use third-party services for hosting and content delivery. These services may collect information about your visit in accordance with their own privacy policies.
        </p>
        <ul>
            <li><strong>Vercel:</strong> Our hosting provider.</li>
            <li><strong>YouTube API:</strong> We embed education videos from YouTube. By using these services, you agree to be bound by the YouTube Terms of Service and Google Privacy Policy.</li>
        </ul>
      </section>

      <section>
        <h2>6. Data Security</h2>
        <p>
            We use administrative, technical, and physical security measures to help protect your personal information. 
            While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>
      </section>

      <section>
        <h2>7. Grievance Redressal</h2>
        <p>
            In accordance with the Information Technology Act, 2000 and Rules made thereunder, if you have any grievance or questions regarding the policy, you may contact our Grievance Officer:
        </p>
        <div class="contact-box">
            <p><strong>Email:</strong> support@physicsium.com</p>
            <p><strong>Address:</strong> [Your Business Address, India]</p>
        </div>
      </section>

      <section>
        <h2>8. Governing Law</h2>
        <p>
            These terms shall be governed by and constructed in accordance with the laws of India without reference to conflict of laws principles and disputes arising in relation hereto shall be subject to the exclusive jurisdiction of the courts at New Delhi, India.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.privacy-container {
  padding-top: 6rem;
  padding-bottom: 4rem;
  min-height: 100vh;
}

.content {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 3rem;
  max-width: 900px;
  margin: 0 auto;
  backdrop-filter: blur(10px);
}

.page-title {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-glow);
  display: inline-block;
}

.last-updated {
    color: var(--text-secondary);
    margin-bottom: 3rem;
    font-style: italic;
}

section {
    margin-bottom: 2.5rem;
}

h2 {
    color: #fff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

p, li {
    color: #cbd5e1;
    line-height: 1.7;
    margin-bottom: 0.8rem;
}

ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
}

strong {
    color: var(--primary-glow);
}

.contact-box {
    background: rgba(255,255,255,0.05);
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--primary-glow);
}
</style>
