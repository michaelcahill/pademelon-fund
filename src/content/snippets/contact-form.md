<form id="contact-form" class="mt-8 grid gap-5">
  <div>
    <label for="cf-subject" class="field-label">Subject</label>
    <input type="text" id="cf-subject" name="subject" required class="field" />
  </div>
  <div>
    <label for="cf-message" class="field-label">Message</label>
    <textarea id="cf-message" name="message" rows="5" required class="field"></textarea>
  </div>
  <button type="submit" class="btn btn-primary inline-flex min-h-11 items-center justify-center px-5 text-sm font-semibold">Send email</button>
</form>

<script>
  document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = document.getElementById('cf-subject').value;
    var m = document.getElementById('cf-message').value;
    window.open('mailto:contact@pademelon.fund?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(m), '_blank');
  });
</script>
