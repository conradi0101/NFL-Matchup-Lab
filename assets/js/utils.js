// AGE
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();

    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// HEIGHT
function formatHeight(inches) {

    const feet = Math.floor(inches / 12);
    const remaining = inches % 12;

    return `${feet}' ${remaining}"`;
}

// EXPERIENCE
function calculateExperience(draftYear) {
    return new Date().getFullYear() - draftYear;
}