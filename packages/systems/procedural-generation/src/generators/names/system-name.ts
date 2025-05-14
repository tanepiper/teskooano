export function generateSystemName(random: () => number): string {
  const prefixes = [
    "Andromeda",
    "Orion",
    "Cygnus",
    "Draco",
    "Lyra",
    "Aquila",
    "Pegasus",
    "Ursa",
    "Virgo",
    "Centaurus",
    "Kepler",
    "Gliese",
    "HD",
    "HIP",
    "Tau",
    "Epsilon",
    "Zeta",
  ];
  const separators = ["-", " ", ""];
  const suffixes = [
    "Prime",
    "Secundus",
    "Tertius",
    "Minor",
    "Major",
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",
  ];

  const prefix = prefixes[Math.floor(random() * prefixes.length)];
  const separator = separators[Math.floor(random() * separators.length)];

  let designation = "";

  if (random() < 0.7) {
    designation = String(Math.floor(random() * 999) + 1);

    if (random() < 0.3) {
      designation += String.fromCharCode(65 + Math.floor(random() * 6));
    }
  } else {
    designation = suffixes[Math.floor(random() * suffixes.length)];
  }

  return `${prefix}${separator}${designation}`;
}
