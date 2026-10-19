import {useImportModelStateDialogStore} from "@AppBuilderLib/features/model-state/model/useImportModelStateDialogStore";
import ImportModelStateDialog from "./ImportModelStateDialog";

/** Always-mounted host so executeActions can open the import-model-state dialog. */
export default function ImportModelStateDialogHost() {
	const current = useImportModelStateDialogStore((state) => state.current);
	const close = useImportModelStateDialogStore((state) => state.close);
	if (!current) return null;

	return (
		<ImportModelStateDialog
			key={current.namespace}
			opened
			namespace={current.namespace}
			onClose={close}
		/>
	);
}
