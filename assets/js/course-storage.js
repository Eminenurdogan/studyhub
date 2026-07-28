(function initializeCourseStorage(global) {
  const STORAGE_KEY = "studyhub.courses.v1";
  const VALID_COLORS = new Set([
    "lavender",
    "mint",
    "sky",
    "coral",
    "peach",
    "pink",
  ]);

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLocaleLowerCase("tr-TR");

  const sanitizeCourse = (course) => {
    if (
      !course ||
      typeof course.id !== "string" ||
      typeof course.name !== "string" ||
      !course.name.trim()
    ) {
      return null;
    }

    return {
      id: course.id,
      name: course.name.trim(),
      color: VALID_COLORS.has(course.color) ? course.color : "lavender",
      description:
        typeof course.description === "string" ? course.description.trim() : "",
      createdAt:
        typeof course.createdAt === "string"
          ? course.createdAt
          : new Date().toISOString(),
      ...(typeof course.updatedAt === "string"
        ? { updatedAt: course.updatedAt }
        : {}),
    };
  };

  const getAll = () => {
    try {
      const parsed = JSON.parse(global.localStorage.getItem(STORAGE_KEY) ?? "[]");

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(sanitizeCourse).filter(Boolean);
    } catch (error) {
      console.error("Ders verileri yüklenemedi.", error);
      return [];
    }
  };

  const saveAll = (courses) => {
    try {
      const sanitizedCourses = courses.map(sanitizeCourse).filter(Boolean);
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedCourses));
      return true;
    } catch (error) {
      console.error("Ders verileri kaydedilemedi.", error);
      return false;
    }
  };

  const hasDuplicateName = (courses, name, excludedId = null) =>
    courses.some(
      (course) =>
        course.id !== excludedId && normalize(course.name) === normalize(name),
    );

  global.StudyHubCourseStore = Object.freeze({
    STORAGE_KEY,
    getAll,
    saveAll,
    hasDuplicateName,
  });
})(window);
