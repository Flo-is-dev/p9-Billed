/**
 * @jest-environment jsdom
 */

import MockedStore from "../__mocks__/store.js";
import Bills from "../containers/Bills";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //   *  Vérifie si l'icône "window" dans la barre latérale a la classe active-icon,
      const hasActiveIconClass = windowIcon.classList.contains("active-icon");
      expect(hasActiveIconClass).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // * Test pour vérifier si cliquer sur le bouton "New Bill" navigue vers la page de création d'une nouvelle facture
    test("Then clicking on 'New Bill' button should navigate to the NewBill page", async () => {
      // * Définit le localStorage mock pour simuler un environnement de test.
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      // *  Simule un utilisateur de type "Employee" connecté dans le localStorage.
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // * Crée un élément div avec l'ID root pour servir de conteneur principal pour l'application.
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);

      router();
      //   * Commentaire : Navigue vers la page des factures en utilisant la route définie.
      await window.onNavigate(ROUTES_PATH.Bills);

      // * Attend que le bouton "New Bill" apparaisse dans le DOM, Récupère le bouton "New Bill" dans le DOM et simule un clic dessus.
      await waitFor(() => screen.getByTestId("btn-new-bill"));
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      await buttonNewBill.dispatchEvent(new MouseEvent("click"));

      // * Récupère l'URL de la page après la navigation
      const newBillUrl = window.location.href.replace(
        /^https?:\/\/localhost\//,
        ""
      );
      // * Vérifie si l'URL correspond à celle de la page NewBill pour un employé
      expect(newBillUrl).toBe("#employee/bill/new");
    });

    // * Début du test pour vérifier que la méthode handleClickIconEye est appelée lorsqu'on clique sur une icône de visualisation de facture.
    test("handleClickIconEye is called when the icon is clicked", () => {
      // Crée une instance de la classe Bills avec les paramètres document, onNavigate (simulé avec Jest) et store (mocké).
      const billsInstance = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: MockedStore,
      });
      const mockIcon = document.createElement("div");
      mockIcon.setAttribute("data-bill-url", "mockBillUrl");

      //* Mocke la méthode handleClickIconEye de l'instance de Bills pour vérifier qu'elle est bien appelée.
      billsInstance.handleClickIconEye = jest.fn();

      //* Mocke la méthode modal de jQuery pour simuler l'ouverture d'une modale sans interaction réelle avec l'interface.
      window.$.fn.modal = jest.fn();

      mockIcon.addEventListener("click", () =>
        billsInstance.handleClickIconEye(mockIcon)
      );

      mockIcon.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      //*  Vérifie que la méthode handleClickIconEye a été appelée avec l'icône correspondante.
      expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(mockIcon);
    });

    // * Début du test pour vérifier que la méthode handleClickIconEye déclenche bien l'ouverture de la modale.
    test("handleClickIconEye shows modal", () => {
      const billsInstance = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: MockedStore,
      });
      const mockIcon = document.createElement("div");
      mockIcon.setAttribute("data-bill-url", "mockBillUrl");

      // Mock the modal function directly on the prototype of window.$
      window.$.fn.modal = jest.fn();

      billsInstance.handleClickIconEye(mockIcon);

      // * Vérifie que la méthode modal de jQuery a été appelée avec le paramètre "show", ce qui déclenche l'affichage de la modale.
      expect(window.$.fn.modal).toHaveBeenCalledWith("show");
    });

    // * Mocke le store avec des factures pour simuler une réponse réussie lorsque la méthode list est appelée.
    const mockStore = {
      bills: jest.fn(() => ({
        list: jest.fn(() =>
          Promise.resolve([
            {
              id: "47qAXb6fIm2zOKkLzMro",
              vat: "80",
              fileUrl:
                "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
              status: "pending",
              type: "Hôtel et logement",
              commentary: "séminaire billed",
              name: "encore",
              fileName: "preview-facture-free-201801-pdf-1.jpg",
              date: "2004-04-04",
              amount: 400,
              commentAdmin: "ok",
              email: "a@a",
              pct: 20,
            },
            {
              id: "BeKy5Mo4jkmdfPGYpTxZ",
              vat: "",
              amount: 100,
              name: "test1",
              fileName: "1592770761.jpeg",
              commentary: "plop",
              pct: 20,
              type: "Transports",
              email: "a@a",
              fileUrl:
                "https://test.storage.tld/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
              date: "2001-01-01",
              status: "refused",
              commentAdmin: "en fait non",
            },
          ])
        ),
      })),
    };

    // * Début du test pour vérifier que la méthode getBills récupère correctement les factures depuis le store mocké.
    test("getBills successfully retrieves bills from the mock store", async () => {
      const billsComponent = new Bills({
        document,
        onNavigate,
        store: mockStore,
      });
      const getBillsPromise = billsComponent.getBills();

      await getBillsPromise;

      //* Vérifie que la méthode bills du store mocké a bien été appelée une fois.
      expect(mockStore.bills).toHaveBeenCalledTimes(1);

      const billsFromStore = await mockStore.bills().list();

      // * Vérifie que les factures récupérées depuis le store mocké existent et que le tableau contient bien 2 éléments (selon les données mockées).
      expect(billsFromStore).toBeTruthy();
      expect(billsFromStore.length).toBe(2);
    });
  });
});
