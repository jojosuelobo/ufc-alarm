/// "Light Heavyweight Bout" -> "Light Heavyweight"
String? formatWeightClass(String? weightClass) {
  if (weightClass == null) return null;
  return weightClass.replaceFirst(RegExp(r'\s*Bout$', caseSensitive: false), '');
}

