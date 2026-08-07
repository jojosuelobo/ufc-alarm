/// "Light Heavyweight Bout" -> "Light Heavyweight"
String? formatWeightClass(String? weightClass) {
  if (weightClass == null) return null;
  return weightClass.replaceFirst(RegExp(r'\s*Bout$', caseSensitive: false), '');
}

/// "Magomed Ankalaev" -> "MA"
String initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  final first = parts.isNotEmpty && parts[0].isNotEmpty ? parts[0][0] : '';
  final last = parts.length > 1 && parts.last.isNotEmpty ? parts.last[0] : '';
  return (first + last).toUpperCase();
}
