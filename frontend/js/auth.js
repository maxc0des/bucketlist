async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const invite = document.getElementById("invite").value;
  const errorEl = document.getElementById("error");

  const ok = await consumeInvite(invite);

  if (!ok) {
    errorEl.textContent = "Ungültiger Einladungs-Code.";
    return;
  }

  // 2. User registrieren
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    errorEl.textContent = error.message;
    return;
  }
  else {
      // Profil erstellen
    await supabaseClient
      .from("profiles")
      .insert({
        id: data.user.id,
        username: "", // leer oder default
        bio: ""
      });

  }
  window.location.href = "profile.html";
}

async function consumeInvite(code) {
  const { data, error } = await supabaseClient
    .from("invite_codes")
    .update({ used: true })
    .eq("code", code)
    .eq("used", false)
    .select("code"); // minimal!

  if (error) {
    console.error("Invite error:", error);
    return false;
  }

  return Array.isArray(data) && data.length === 1;
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) alert(error.message);
  else window.location.href = "feed.html";
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}