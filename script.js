function openPopup(src) {
    document.getElementById('popup-img').src = src;
    document.getElementById('popup').classList.remove('hidden');
  }

  function closePopup() {
    document.getElementById('popup').classList.add('hidden');
  }



  function openPopup(src) {
    document.getElementById('popup-img').src = src;
    document.getElementById('popup').classList.remove('hidden');
  }

  function closePopup() {
    document.getElementById('popup').classList.add('hidden');
  }



  function toggleSubMenu(id) {
    const menu = document.getElementById(id);
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }



  function toggleGroup(id) {
    const group = document.getElementById(id);
    group.classList.toggle("hidden");
  }

  function openImage(src) {
    window.open(src, '_blank');
  }



  function toggleGallery(id) {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
  }

  function openImage(src) {
    const popup = document.getElementById('imagePopup');
    const popupImg = document.getElementById('popupImage');
    popupImg.src = src;
    popup.classList.remove('hidden');
  }

  function closeImage() {
    document.getElementById('imagePopup').classList.add('hidden');
  }



    function showSection(id) {
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => section.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    }
  


    function showSection(id) {
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });

      const selected = document.getElementById(id);
      if (selected) {
        selected.classList.add('active');
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      showSection('home');

      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang');
      if (lang === 'en') {
        document.documentElement.lang = 'en';
        document.querySelectorAll('.khmer').forEach(el => el.style.display = 'none');
        // Add more logic to toggle English content
      } else {
        document.documentElement.lang = 'km';
      }
    });