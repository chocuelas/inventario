document.addEventListener("DOMContentLoaded", function () {
  const fechaInput = document.getElementById("fecha");
  const hoy = new Date().toISOString().split("T")[0];
  fechaInput.value = hoy;

  google.script.run
    .withSuccessHandler(function (configs) {
      const container = document.getElementById("itemsContainer");

      configs.forEach((config) => {
        const card = document.createElement("details");
        card.className = "item-card";

        const resumen = document.createElement("summary");
        resumen.textContent = config["Ítem"];
        card.appendChild(resumen);

        const content = document.createElement("div");
        content.className = "inputs";

        const campos = [
          { label: "Medida", name: "medida", readonly: true, value: config["Medida"] },
          { label: "Stock Inicial Cocina", name: "stockInicial" },
          { label: "Usado en Cocina", name: "usadoCocina" },
          { label: "Despachado al Punto", name: "despachado" },
          { label: "Observaciones", name: "observaciones" },
        ];

        campos.forEach((c) => {
          const div = document.createElement("div");
          const label = document.createElement("label");
          label.textContent = c.label;

          const input = document.createElement("input");
          input.name = c.name;
          input.type = c.name === "observaciones" ? "text" : "number";
          if (c.readonly) {
            input.value = c.value;
            input.readOnly = true;
          }

          div.appendChild(label);
          div.appendChild(input);
          content.appendChild(div);
        });

        const stockFinalDiv = document.createElement("div");
        const stockFinalLabel = document.createElement("label");
        stockFinalLabel.textContent = "Stock Final (Calculado)";
        const stockFinalInput = document.createElement("input");
        stockFinalInput.name = "stockFinal";
        stockFinalInput.readOnly = true;
        stockFinalInput.style.background = "#eee";
        stockFinalDiv.appendChild(stockFinalLabel);
        stockFinalDiv.appendChild(stockFinalInput);
        content.appendChild(stockFinalDiv);

        const alerta = document.createElement("p");
        alerta.className = "alerta";
        alerta.style.display = "none";
        content.appendChild(alerta);

        const inputs = content.querySelectorAll("input");
        inputs.forEach((input) => {
          input.addEventListener("input", () => {
            const inicial = Number(content.querySelector("input[name='stockInicial']").value) || 0;
            const usado = Number(content.querySelector("input[name='usadoCocina']").value) || 0;
            const despachado = Number(content.querySelector("input[name='despachado']").value) || 0;
            const final = inicial - usado - despachado;

            stockFinalInput.value = final;

            if (final <= Number(config["Stock Mínimo"])) {
              alerta.textContent = "Hacer pedido";
              alerta.style.display = "block";
              stockFinalInput.style.color = "red";
            } else {
              alerta.textContent = "";
              alerta.style.display = "none";
              stockFinalInput.style.color = "black";
            }
          });
        });

        card.appendChild(content);
        container.appendChild(card);
      });
    })
    .withFailureHandler(function (err) {
      alert("❌ Error cargando configuración: " + err.message);
    })
    .getConfiguracion();

  document.getElementById("inventarioForm").addEventListener("submit", function (e) {
    e.preventDefault();
    document.getElementById("loaderModal").style.display = "flex";

    const items = [];
    document.querySelectorAll(".item-card").forEach((card) => {
      const item = card.querySelector("summary").textContent;
      const inputs = card.querySelectorAll("input");

      const data = {
        item,
        medida: inputs.namedItem("medida").value,
        stockInicial: inputs.namedItem("stockInicial").value,
        usadoCocina: inputs.namedItem("usadoCocina").value,
        despachado: inputs.namedItem("despachado").value,
        stockFinal: inputs.namedItem("stockFinal").value,
        observaciones: inputs.namedItem("observaciones").value,
      };
      items.push(data);
    });

    google.script.run
      .withSuccessHandler(function (res) {
        alert(res);
        document.getElementById("loaderModal").style.display = "none";
      })
      .withFailureHandler(function (err) {
        alert("Error: " + err.message);
        document.getElementById("loaderModal").style.display = "none";
      })
      .guardarInventario(items);
  });
});
