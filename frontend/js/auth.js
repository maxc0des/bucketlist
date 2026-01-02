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
  alert("registration successful! verify your email and log in.");
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
  //check if first login (no profile)
  const user = supabaseClient.auth.getUser();
  const { data: profileData, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", (await user).data.user.id);
  if (profileError) {
    console.error("Profile fetch error:", profileError);
    alert("An error occurred while fetching profile data.");
    window.location.href = "settings.html";
  }
  if (profileData.length === 0) window.location.href = "settings.html";
  else window.location.href = "feed.html";
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}