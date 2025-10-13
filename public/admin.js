document.addEventListener("DOMContentLoaded", () => {
  const ADMIN_TELEGRAM_ID = "7613674527";

  const adminPanelBtn = document.getElementById("adminPanelBtn");
  const uploadBtn = document.getElementById("uploadAdBtn");
  const adImage = document.getElementById("adImage");
  const adTitle = document.getElementById("adTitle");
  const adDesc = document.getElementById("adDesc");
  const adTags = document.getElementById("adTags");
  const adLink = document.getElementById("adLink");
  const adReward = document.getElementById("adReward");
  const adUsername = document.getElementById("adUsername");

  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe?.user;

  if (user && String(user.id) === ADMIN_TELEGRAM_ID) {
    adminPanelBtn.style.display = "block";
    adminPanelBtn.addEventListener("click", () => showPage("page-admin"));
  }

  uploadBtn.addEventListener("click", async () => {
    if (!adTitle.value || !adDesc.value || !adLink.value || !adReward.value) {
      alert("❗ Please fill in all required fields");
      return;
    }

    const file = adImage.files[0];
    if (!file) {
      alert("❗ Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("telegramId", user.id);
    formData.append("title", adTitle.value.trim());
    formData.append("username", adUsername.value.trim());
    formData.append("desc", adDesc.value.trim());
    formData.append("tags", adTags.value.trim());
    formData.append("link", adLink.value.trim());
    formData.append("reward", adReward.value.trim());
    formData.append("image", file);

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {
      const res = await fetch("/api/admin/uploadAd", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        alert("✅ Ad successfully added!");
        adTitle.value = "";
        adUsername.value = "";
        adDesc.value = "";
        adTags.value = "";
        adLink.value = "";
        adReward.value = "";
        adImage.value = "";
      } else {
        alert("❌ Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network error");
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = "📤 Publish Ad";
    }
  });

const deleteTagInput = document.getElementById("deleteTagInput");
const deleteAdBtn = document.getElementById("deleteAdBtn");
const deleteResult = document.getElementById("deleteResult");

deleteAdBtn.addEventListener("click", async () => {
  const tag = deleteTagInput.value.trim();
  if (!tag) {
    deleteResult.textContent = "❗ Type your tag";
    return;
  }

  try {
    const res = await fetch("/api/admin/ad", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag })
    });

    const data = await res.json();
    if (res.ok) {
      deleteResult.textContent = `✅ Ad(s) with tag "${tag}" deleted`;
      deleteTagInput.value = "";
    } else {
      deleteResult.textContent = data.error || "❌ Error";
    }
  } catch (err) {
    console.error(err);
    deleteResult.textContent = "❌ Server error";
  }
});


});

