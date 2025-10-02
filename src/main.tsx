import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConfigProvider, theme, Button } from "antd";

function Root() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div style={{ padding: 10, textAlign: "right" }}>
        <Button type="primary" onClick={() => setIsDark(!isDark)}>
          {isDark ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </Button>
      </div>
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
