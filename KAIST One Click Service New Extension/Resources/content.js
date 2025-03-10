console.log("Content script loaded");

// URL 매칭 함수
const matchPattern = "https://sso.kaist.ac.kr/auth/*"; // https://iam2.kaist.ac.kr/*"; --> https://sso.kaist.ac.kr/auth*
const regex = new RegExp(matchPattern.replace("*", ".*"));

async function initialize() {
  console.log("DOM 초기화 시도");

  const currentUrl = window.location.href;
  console.log("현재 URL:", currentUrl);

  const isMatch = regex.test(currentUrl);
  console.log("URL 매칭 여부:", isMatch);

  const secondViewUrl = "https://sso.kaist.ac.kr/auth/kaist/user/login/second/view";
  if (currentUrl === secondViewUrl) {
    console.log("Second view");

    browser.runtime.sendMessage({action: "startAuthProcess"});
  } else if (isMatch) {
    console.log("페이지가 매칭됩니다.");

    // waitForElement 함수 정의
    const waitForElement = (selector, interval = 500, maxAttempts = 10) => {
      return new Promise((resolve, reject) => {
        let attempts = 0;

        const intervalId = setInterval(() => {
          const element = document.querySelector(selector);
          attempts++;

          if (element) {
            clearInterval(intervalId);
            resolve(element);
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            reject(new Error(`Element not found: ${selector} within the maximum attempts`));
          }
        }, interval);
      });
    };

    try {
      // waitForElement로 로그인 링크 대기
      const loginLink = await waitForElement("a[href=\"#loginTab02\"]");
      console.log("Login link found. Clicking...");

      // 클릭 이벤트 트리거
      const event = new MouseEvent("click", {
        bubbles: true, cancelable: true, view: window
      });
      loginLink.dispatchEvent(event);

      console.log("Login link clicked. Waiting for next step...");
      await delay(1000); // 클릭 후 대기

      // 인증 프로세스 시작
      browser.runtime.sendMessage({action: "startAuthProcess"});
    } catch (error) {
      console.log("비밀번호 인증 버튼을 찾을 수 없습니다:", error.message);
    }
  } else {
    console.log("페이지가 매칭되지 않습니다.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded 이벤트 발생");
    initialize();
  });
} else {
  console.log("이미 DOM이 로드됨");
  initialize();
}
