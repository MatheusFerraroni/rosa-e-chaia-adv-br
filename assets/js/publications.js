(() => {
  const controls = document.querySelector("[data-publications-controls]");
  const list = document.querySelector("[data-publications-list]");
  const pagination = document.querySelector("[data-publications-pagination]");

  if (!controls || !list || !pagination) {
    return;
  }

  const searchInput = controls.querySelector('[name="q"]');
  const yearSelect = controls.querySelector('[name="ano"]');
  const authorSelect = controls.querySelector('[name="autor"]');
  const categorySelect = controls.querySelector('[name="categoria"]');
  const tagSelect = controls.querySelector('[name="tag"]');
  const orderSelect = controls.querySelector('[name="ordem"]');
  const clearButton = controls.querySelector("[data-publications-clear]");
  const results = controls.querySelector("[data-publications-results]");
  const noResults = controls.querySelector("[data-publications-no-results]");
  const pageSize = 6;
  const validOrders = new Set(["recentes", "antigas", "titulo"]);
  let indexData;
  let searchTimer;
  let state;

  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/\s+/g, " ")
      .trim();

  const cardById = new Map(
    Array.from(list.querySelectorAll("[data-publication-id]")).map((card) => [
      card.dataset.publicationId,
      card,
    ]),
  );

  const setOptions = (select, facets) => {
    if (!select) {
      return;
    }
    facets.forEach((facet) => {
      const option = document.createElement("option");
      option.value = facet.id;
      option.textContent = `${facet.label} (${facet.count})`;
      select.append(option);
    });
  };

  const readStateFromUrl = () => {
    const parameters = new URLSearchParams(window.location.search);
    const requestedOrder = parameters.get("ordem") ?? "recentes";
    const requestedPage = Number.parseInt(parameters.get("pagina") ?? "1", 10);
    return {
      q: parameters.get("q")?.trim() ?? "",
      year: parameters.get("ano") ?? "",
      author: parameters.get("autor") ?? "",
      category: parameters.get("categoria") ?? "",
      tag: parameters.get("tag") ?? "",
      order: validOrders.has(requestedOrder) ? requestedOrder : "recentes",
      page: Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
    };
  };

  const syncControls = () => {
    searchInput.value = state.q;
    yearSelect.value = optionExists(yearSelect, state.year) ? state.year : "";
    authorSelect.value = optionExists(authorSelect, state.author)
      ? state.author
      : "";
    categorySelect.value = optionExists(categorySelect, state.category)
      ? state.category
      : "";
    tagSelect.value = optionExists(tagSelect, state.tag) ? state.tag : "";
    orderSelect.value = state.order;

    state.year = yearSelect.value;
    state.author = authorSelect.value;
    state.category = categorySelect.value;
    state.tag = tagSelect.value;
  };

  const optionExists = (select, value) =>
    !value || Array.from(select.options).some((option) => option.value === value);

  const searchTextFor = (item) =>
    normalize(
      [
        item.title,
        item.summary,
        ...item.authors.map((author) => author.name),
        ...item.categories.map((category) => category.label),
        ...item.tags.map((tag) => tag.label),
      ].join(" "),
    );

  const itemMatches = (item, normalizedQuery) => {
    if (normalizedQuery && !searchTextFor(item).includes(normalizedQuery)) {
      return false;
    }
    if (state.year && String(item.year) !== state.year) {
      return false;
    }
    if (
      state.author &&
      !item.authors.some((author) => author.id === state.author)
    ) {
      return false;
    }
    if (
      state.category &&
      !item.categories.some((category) => category.id === state.category)
    ) {
      return false;
    }
    if (state.tag && !item.tags.some((tag) => tag.id === state.tag)) {
      return false;
    }
    return true;
  };

  const compareItems = (left, right) => {
    if (state.order === "titulo") {
      return left.title.localeCompare(right.title, "pt-BR");
    }
    const comparison = left.date.localeCompare(right.date);
    if (comparison !== 0) {
      return state.order === "antigas" ? comparison : -comparison;
    }
    return left.title.localeCompare(right.title, "pt-BR");
  };

  const updateUrl = (mode) => {
    const parameters = new URLSearchParams();
    if (state.q) parameters.set("q", state.q);
    if (state.year) parameters.set("ano", state.year);
    if (state.author) parameters.set("autor", state.author);
    if (state.category) parameters.set("categoria", state.category);
    if (state.tag) parameters.set("tag", state.tag);
    if (state.order !== "recentes") parameters.set("ordem", state.order);
    if (state.page > 1) parameters.set("pagina", String(state.page));

    const query = parameters.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history[mode === "push" ? "pushState" : "replaceState"](
      null,
      "",
      url,
    );
  };

  const render = ({ historyMode = null } = {}) => {
    syncControls();
    const allItems = [...indexData.items].sort(compareItems);
    const normalizedQuery = normalize(state.q);
    const matchingItems = allItems.filter((item) =>
      itemMatches(item, normalizedQuery),
    );
    const pageCount = Math.max(1, Math.ceil(matchingItems.length / pageSize));

    if (state.page > pageCount) {
      state.page = 1;
    }

    const firstIndex = (state.page - 1) * pageSize;
    const visibleIds = new Set(
      matchingItems
        .slice(firstIndex, firstIndex + pageSize)
        .map((item) => item.id),
    );

    allItems.forEach((item) => {
      const card = cardById.get(item.id);
      if (!card) {
        return;
      }
      list.append(card);
      card.hidden = !visibleIds.has(item.id);
    });

    if (matchingItems.length === 0) {
      results.textContent = "Nenhuma publicação encontrada.";
      noResults.hidden = false;
    } else {
      const firstResult = firstIndex + 1;
      const lastResult = Math.min(firstIndex + pageSize, matchingItems.length);
      const resultLabel =
        matchingItems.length === 1
          ? "publicação encontrada"
          : "publicações encontradas";
      results.textContent = `${matchingItems.length} ${resultLabel}. Exibindo ${firstResult} a ${lastResult}.`;
      noResults.hidden = true;
    }

    renderPagination(pageCount);
    if (historyMode) {
      updateUrl(historyMode);
    }
  };

  const renderPagination = (pageCount) => {
    pagination.replaceChildren();
    if (pageCount <= 1) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;
    const container = document.createElement("ul");
    container.className = "publications-pagination-list";
    addPageLink(container, "Anterior", state.page - 1, state.page === 1);

    paginationSequence(state.page, pageCount).forEach((value) => {
      if (value === "ellipsis") {
        const item = document.createElement("li");
        item.className = "publications-pagination-ellipsis";
        item.textContent = "…";
        item.setAttribute("aria-hidden", "true");
        container.append(item);
        return;
      }
      addPageLink(container, String(value), value, false, value === state.page);
    });

    addPageLink(
      container,
      "Próxima",
      state.page + 1,
      state.page === pageCount,
    );
    pagination.append(container);
  };

  const paginationSequence = (currentPage, pageCount) => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    const values = new Set([
      1,
      pageCount,
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ]);
    const pages = [...values]
      .filter((page) => page >= 1 && page <= pageCount)
      .sort((left, right) => left - right);
    const sequence = [];
    pages.forEach((page, index) => {
      if (index > 0 && page - pages[index - 1] > 1) {
        sequence.push("ellipsis");
      }
      sequence.push(page);
    });
    return sequence;
  };

  const addPageLink = (
    container,
    label,
    targetPage,
    disabled,
    current = false,
  ) => {
    const item = document.createElement("li");
    if (disabled) {
      const span = document.createElement("span");
      span.className = "publications-pagination-link is-disabled";
      span.textContent = label;
      span.setAttribute("aria-disabled", "true");
      item.append(span);
    } else {
      const link = document.createElement("a");
      const parameters = new URLSearchParams(window.location.search);
      if (targetPage > 1) {
        parameters.set("pagina", String(targetPage));
      } else {
        parameters.delete("pagina");
      }
      link.href = `${window.location.pathname}${
        parameters.size ? `?${parameters}` : ""
      }`;
      link.className = "publications-pagination-link";
      link.textContent = label;
      link.dataset.page = String(targetPage);
      if (current) {
        link.setAttribute("aria-current", "page");
      }
      item.append(link);
    }
    container.append(item);
  };

  const resetToFirstPage = () => {
    state.page = 1;
  };

  controls.addEventListener("submit", (event) => {
    event.preventDefault();
    resetToFirstPage();
    state.q = searchInput.value.trim();
    render({ historyMode: "push" });
  });

  [yearSelect, authorSelect, categorySelect, tagSelect, orderSelect].forEach(
    (select) => {
      select.addEventListener("change", () => {
        state.year = yearSelect.value;
        state.author = authorSelect.value;
        state.category = categorySelect.value;
        state.tag = tagSelect.value;
        state.order = orderSelect.value;
        resetToFirstPage();
        render({ historyMode: "push" });
      });
    },
  );

  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.q = searchInput.value.trim();
      resetToFirstPage();
      render({ historyMode: "replace" });
    }, 200);
  });

  clearButton.addEventListener("click", () => {
    state = {
      q: "",
      year: "",
      author: "",
      category: "",
      tag: "",
      order: "recentes",
      page: 1,
    };
    render({ historyMode: "push" });
    searchInput.focus();
  });

  pagination.addEventListener("click", (event) => {
    const link = event.target.closest("[data-page]");
    if (!link) {
      return;
    }
    event.preventDefault();
    state.page = Number(link.dataset.page);
    render({ historyMode: "push" });
    results.focus?.();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    list.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });

  window.addEventListener("popstate", () => {
    state = readStateFromUrl();
    render();
  });

  fetch(controls.dataset.indexUrl, {
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Falha ao carregar índice: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.schemaVersion !== 1 || !Array.isArray(data.items)) {
        throw new Error("Versão de índice incompatível");
      }
      indexData = data;
      setOptions(yearSelect, data.facets.years);
      setOptions(authorSelect, data.facets.authors);
      setOptions(categorySelect, data.facets.categories);
      setOptions(tagSelect, data.facets.tags);
      state = readStateFromUrl();
      controls.hidden = false;
      render();
    })
    .catch((error) => {
      console.error("Não foi possível ativar os filtros de publicações.", error);
    });
})();
