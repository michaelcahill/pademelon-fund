<form id="contact-form" class="mt-8">
  <div class="grid gap-4">
    <div>
      <label for="cf-subject" class="block text-sm font-medium text-slate-700">Subject</label>
      <input type="text" id="cf-subject" name="subject" required class="mt-1 block w-full rounded-md border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:ring-emerald-600 sm:text-sm" />
    </div>
    <div>
      <label for="cf-message" class="block text-sm font-medium text-slate-700">Message</label>
      <textarea id="cf-message" name="message" rows="5" required class="mt-1 block w-full rounded-md border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-600 focus:ring-emerald-600 sm:text-sm"></textarea>
    </div>
  </div>
  <button type="submit" class="mt-6 inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-700 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">Send email</button>
</form>

<script>
  document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = document.getElementById('cf-subject').value;
    var m = document.getElementById('cf-message').value;
    window.open('mailto:contact@pademelon.fund?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(m), '_blank');
  });
</script>
