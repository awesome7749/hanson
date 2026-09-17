import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../App";
function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
function radio(name: string) {
  fireEvent.click(screen.getByRole("radio", { name }));
}
function next() {
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}
beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  window.scrollTo = jest.fn();
});
test("assessment request can be reviewed, edited, saved and found in the staff view", async () => {
  window.history.replaceState({}, "", "/start?intent=assessment");
  const view = render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole("radio", { name: /An energy assessment/ }),
    ).toBeChecked(),
  );
  fill("Street address", "12 Example Lane");
  fill("City or town", "Lexington");
  fill("ZIP code", "02420");
  next();
  radio("I own my home");
  radio("Single-family");
  next();
  expect(
    screen.queryByText("How is your home heated?"),
  ).not.toBeInTheDocument();
  radio("Oil");
  radio("Just exploring");
  next();
  fill("Electricity provider", "Not sure");
  radio("Not yet");
  fill("Preferred assessment date (optional)", "2099-01-05");
  next();
  fill("First name", "Alex");
  fill("Last name", "Example");
  fill("Email address", "alex@example.com");
  fill("Phone number", "202-555-0130");
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I agree to be contacted/ }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  expect(
    screen.getByRole("heading", { name: "Does this look right?" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit Your address" }));
  expect(screen.getByLabelText("Street address")).toHaveValue(
    "12 Example Lane",
  );
  fill("Street address", "14 Example Lane");
  next();
  next();
  next();
  next();
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Create preview request" }),
  );
  await screen.findByRole("heading", { name: "Welcome, Alex." });
  expect(screen.getByText(/14 Example Lane, Lexington/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Save date preference" }));
  expect(
    screen.getByText(/Date preference saved in this preview/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Home details" }));
  expect(screen.getByText("alex@example.com")).toBeInTheDocument();
  expect(screen.queryByText("Internal notes")).not.toBeInTheDocument();
  const saved = JSON.parse(
    sessionStorage.getItem("hanson-website-preview-v1")!,
  );
  expect(saved.leads.filter((l: any) => !l.sample)).toHaveLength(1);
  expect(saved.leads[0].status).toBe("assessment_requested");
  view.unmount();
  window.history.replaceState({}, "", "/staff");
  render(<App />);
  fill("Find a request", "Alex Example");
  expect(
    screen.getByRole("heading", { name: "Alex Example" }),
  ).toBeInTheDocument();
  fill("Preview status", "assessment_scheduled");
  fill("Sample appointment", "2099-01-05T10:00");
  fill("Internal notes", "Staff-only example context");
  fireEvent.click(screen.getByRole("button", { name: "Save preview changes" }));
  fireEvent.click(screen.getByRole("link", { name: "Customer view" }));
  await screen.findByRole("heading", { name: "Welcome, Alex." });
  expect(
    screen.getByRole("heading", { name: "Assessment scheduled." }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Staff-only example context"),
  ).not.toBeInTheDocument();
  URL.createObjectURL = jest.fn(() => "blob:test-photo");
  URL.revokeObjectURL = jest.fn();
  fireEvent.click(screen.getByRole("button", { name: /^Photos/ }));
  fireEvent.change(screen.getByLabelText("Add Indoor heating equipment"), {
    target: {
      files: [new File(["sample"], "equipment.png", { type: "image/png" })],
    },
  });
  expect(
    screen.getByRole("img", { name: "Indoor heating equipment" }),
  ).toHaveAttribute("src", "blob:test-photo");
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(
    screen.queryByRole("img", { name: "Indoor heating equipment" }),
  ).not.toBeInTheDocument();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-photo");
  fireEvent.click(
    screen.getByRole("button", { name: "Start another request" }),
  );
  expect(screen.getByLabelText("Street address")).toHaveValue("");
});
test("heat-pump flow handles technical unknowns and requires a matching phone contact", async () => {
  window.history.replaceState({}, "", "/start?intent=heat-pump");
  render(<App />);
  fill("Street address", "26 Sample Road");
  fill("City or town", "Woburn");
  fill("ZIP code", "01801");
  next();
  radio("I own my home");
  radio("Townhouse / condo");
  next();
  for (const name of [
    "How is your home heated?",
    "What heating fuel do you use?",
    "How do you cool your home?",
    "Do you have vents that blow warm or cool air?",
    "How is your system doing?",
  ]) {
    fireEvent.click(
      within(screen.getByRole("group", { name })).getByRole("radio", {
        name: "Not sure",
      }),
    );
  }
  radio("In the next few months");
  next();
  fill("Electricity provider", "Municipal utility");
  radio("Completed");
  fill("Approximately when? (optional)", "2025");
  next();
  fill("First name", "Casey");
  fill("Last name", "Example");
  radio("Phone call");
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I agree to be contacted/ }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  expect(
    await screen.findByText(
      "Enter a valid US phone number so we can follow up.",
    ),
  ).toBeInTheDocument();
  fill("Phone number", "202-555-0140");
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  expect(screen.getByText("Municipal utility")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Create preview request" }),
  );
  await screen.findByRole("heading", { name: "Welcome, Casey." });
});
