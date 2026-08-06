/* =============================================
     Polaris Airlines - Shared Client JS
     public/js/main.js
     ============================================= */


/* ── Toast notification ── */
function showToast(message, type = 'success') {
       const icons = {
            success: 'check-circle-fill',
            danger:   'x-circle-fill',
            warning: 'exclamation-triangle-fill',
            info:     'info-circle-fill'
       };
       const id     = 'toast-' + Date.now();
       const html = `
            <div id="${id}" class="toast align-items-center text-bg-${type}
border-0 show"
                  role="alert" style="min-width:260px;">
               <div class="d-flex">
                      <div class="toast-body">
                         <i class="bi bi-${icons[type] || 'info-circle-fill'}
me-2"></i>${message}
                      </div>
                      <button type="button" class="btn-close btn-close-white
me-2 m-auto"


onclick="document.getElementById('${id}').remove()"></button>
              </div>
        </div>`;


    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }
    container.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, 3500);
}


/* ── Logout ── */
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function (e) {
              e.preventDefault();
              try {
                  const res   = await fetch('/api/auth/logout', { method:
'POST' });
                  const data = await res.json();
                  if (data.success) {
                       window.location.href = '/';
                  } else {
                       showToast('Logout failed. Please try again.',
'danger');
                  }
              } catch (_) {
                  showToast('Network error during logout.', 'danger');
              }
        });
    }
      /* ── Auto-dismiss flash alerts after 4s ── */
      document.querySelectorAll('.alert.alert-dismissible').forEach(function
(el) {
             setTimeout(function () {
                 const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
                 if (bsAlert) bsAlert.close();
             }, 4000);
      });


      /* ── Show registered=true toast if redirected from register ── */
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
             showToast('Account created! Please log in.', 'success');
             /* Clean up URL */
             const url = new URL(window.location.href);
             url.searchParams.delete('registered');
             window.history.replaceState({}, '', url.toString());
      }
});


