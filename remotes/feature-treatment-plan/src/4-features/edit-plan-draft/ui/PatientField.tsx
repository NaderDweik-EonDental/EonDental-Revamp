export function PatientField(props: {
  value: string;
  onChange: (patientId: string) => void;
}) {
  return (
    <label className="tp__field">
      <span>Patient</span>
      <input
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        autoComplete="off"
      />
    </label>
  );
}
